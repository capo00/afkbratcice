import { Crud, Error as CoreError, BinaryStore, Authorization } from "caio-server";
import dao from "./dao.js";
import Config from "../config.js";

/**
 * Album a jeho fotky. Google Cloud Storage náhledy negeneruje, takže každá fotka jsou
 * DVĚ binárky: plná (w1600) a náhled (w400). Zmenšuje je klient před uploadem; plná si
 * drží thumbBinaryId a thumbUri, aby mřížka nepotřebovala druhý dotaz.
 */
class GalleryCrud extends Crud {
  constructor() {
    super("gallery", dao);
  }

  async list({ state, seasonId, matchId, category, pageInfo } = {}, identity) {
    // Nepřihlášený vidí jen publikovaná alba; rozpracované jsou pro redakci.
    const effectiveState = Authorization.hasProfile(identity, Config.GALLERY) ? state : "published";
    const itemList = await dao.listByFilter({ state: effectiveState, seasonId, matchId, category }, pageInfo);
    return itemList.map((item) => this._getData(item));
  }

  /**
   * Rozpracované album nemá mít veřejný odkaz -- `list` ho nepřihlášenému neukáže, ale
   * bez tohohle šlo přečíst napřímo přes `gallery/get?id=...`. 404, ne 403: existence
   * rozpracovaného alba je sama o sobě informace (stejně jako u článku, `article/crud.js`).
   */
  async get(id, identity) {
    const gallery = this._getData(await this._get(id));
    if (!Authorization.hasProfile(identity, Config.GALLERY) && gallery.state !== "published") {
      throw new CoreError("Gallery does not exist", {
        status: 404,
        code: CoreError.code("gallery", "notFound"),
        paramMap: { id },
      });
    }
    return gallery;
  }

  async listPhotos({ id, pageInfo } = {}) {
    return BinaryStore.Binary.list({
      collection: Config.BINARY_COLLECTION.GALLERY,
      refId: id,
      pageInfo,
    }).then((list) => list.filter((b) => b.type === Config.BINARY_TYPE.PHOTO));
  }

  async addPhoto({ id, file, thumb, name }) {
    const gallery = await this._get(id);

    const thumbBinary = thumb
      ? await BinaryStore.Binary.create({
          file: thumb,
          name,
          collection: Config.BINARY_COLLECTION.GALLERY,
          refId: id,
          type: Config.BINARY_TYPE.PHOTO_THUMB,
        })
      : null;

    const binary = await BinaryStore.Binary.create({
      file,
      name,
      collection: Config.BINARY_COLLECTION.GALLERY,
      refId: id,
      type: Config.BINARY_TYPE.PHOTO,
      thumbBinaryId: thumbBinary?.id ?? null,
      thumbUri: thumbBinary?.uri ?? null,
    });

    const patch = { id, photoCount: (gallery.photoCount ?? 0) + 1 };
    // První fotka se stává titulní.
    if (!gallery.coverBinaryId) {
      patch.coverBinaryId = binary.id;
      patch.coverThumbUri = thumbBinary?.uri ?? binary.uri;
    }

    // Vrací se **album**, ne jen nahrané binárky -- stejně jako u sesterské `deletePhoto`
    // a jako u `get`/`list`. Album je objekt, který tahle operace mění (`photoCount`,
    // titulní náhled), takže klient si podle návratové hodnoty může řádek aktualizovat
    // sám. Binárky jdou vedle, pro volajícího, který právě nahrál soubor.
    const updated = await super.update(patch);
    return { ...updated, binary, thumbBinary };
  }

  /**
   * A new album has no photos, so it has no cover either -- the first upload sets it
   * (`addPhoto`). A `coverBinaryId` sent on create could only point at someone else's binary.
   */
  async create({ coverBinaryId, ...data }) {
    return super.create(data);
  }

  /**
   * A cover is a photo of this very album; its thumbnail goes along (`coverThumbUri`), otherwise
   * the web would keep showing the previous cover. `null` clears the cover.
   */
  async update(data) {
    if (!("coverBinaryId" in data)) return super.update(data);
    if (data.coverBinaryId == null) return super.update({ ...data, coverBinaryId: null, coverThumbUri: null });

    const photo = await this._photoOf(data.id, data.coverBinaryId);
    return super.update({ ...data, coverThumbUri: photo.thumbUri ?? photo.uri ?? null });
  }

  async deletePhoto({ id, binaryId }) {
    const gallery = await this._get(id);
    // Only a photo of this album -- the binary store would delete any file (a club crest,
    // a portrait, a download), and the per-collection authorization of `binary/*` does not
    // apply to a library call (design/roles.md, 5.1; review 2026-11-12, V2).
    const binary = await this._photoOf(id, binaryId);

    if (binary.thumbBinaryId) await this._deleteBinary(binary.thumbBinaryId);
    await this._deleteBinary(binaryId);

    const patch = { id, photoCount: Math.max(0, (gallery.photoCount ?? 1) - 1) };
    if (gallery.coverBinaryId === binaryId) {
      const rest = await this.listPhotos({ id });
      const next = rest.find((b) => b.id !== binaryId) ?? null;
      patch.coverBinaryId = next?.id ?? null;
      patch.coverThumbUri = next?.thumbUri ?? next?.uri ?? null;
    }
    return super.update(patch);
  }

  async delete(id) {
    const photoList = await BinaryStore.Binary.list({ collection: Config.BINARY_COLLECTION.GALLERY, refId: id });
    await super.delete(id);
    // Úklid binárek až po smazání alba: kdyby selhal, zůstanou soubory, ne osiřelé album.
    for (const binary of photoList) await this._deleteBinary(binary.id);
  }

  /**
   * The photo `binaryId` of the album `galleryId` (a full-size photo, not its thumbnail). 404,
   * not 403, for anything else: whether some other binary exists is none of the caller's business.
   */
  async _photoOf(galleryId, binaryId) {
    const binary = await BinaryStore.Binary.get(binaryId).catch(() => null);
    const isPhoto =
      binary?.collection === Config.BINARY_COLLECTION.GALLERY &&
      String(binary.refId) === String(galleryId) &&
      binary.type === Config.BINARY_TYPE.PHOTO;
    if (!isPhoto) {
      throw new CoreError("Photo does not exist in this gallery", {
        status: 404,
        code: CoreError.code("gallery", "photoNotFound"),
        paramMap: { id: galleryId, binaryId },
      });
    }
    return binary;
  }

  async _deleteBinary(id) {
    try {
      await BinaryStore.Binary.delete(id);
    } catch (e) {
      console.error("[gallery] photo binary cannot be deleted", id, e?.message ?? e);
    }
  }
}

export default new GalleryCrud();
