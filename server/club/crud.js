import { Crud, Error as CoreError, BinaryStore } from "caio-server";
import dao from "./dao.js";
import teamDao from "../team/dao.js";
import Config from "../config.js";

/**
 * Erb reálného klubu -- jeden záznam, i když klub hraje víc věkových kategorií
 * (design/data-model.md, 1.2). `team.logoUri` zůstává denormalizace pro čtení bez joinu,
 * ale píše se výhradně odsud, přes `TeamDao.updateLogoUriByClub`.
 *
 * Binárka a její úklid při chybě/nahrazení jsou převzaté z `team/crud.js`, jak vypadalo
 * před tímhle refaktorem -- jen o úroveň výš.
 */
class ClubCrud extends Crud {
  constructor() {
    super("club", dao);
  }

  async create(data) {
    const { logo, ...rest } = data;
    let binary;

    if (logo) {
      binary = await BinaryStore.Binary.create({
        file: logo,
        collection: Config.BINARY_COLLECTION.CLUB,
        type: Config.BINARY_TYPE.LOGO,
      });
    }

    try {
      return await super.create({ ...rest, logoId: binary?.id ?? null, logoUri: binary?.uri ?? null });
    } catch (e) {
      if (binary) await this._deleteBinary(binary.id);
      throw e;
    }
  }

  async update(data) {
    const { logo, ...rest } = data;
    const current = await this._get(data.id);

    // `logo: null` = smazat, File = nahradit, undefined = nechat být.
    if (logo === null) {
      if (current.logoId) await this._deleteBinary(current.logoId);
      const updated = await super.update({ ...rest, logoId: null, logoUri: null });
      await teamDao.updateLogoUriByClub(updated.id, null);
      return updated;
    }

    if (!logo) return super.update(rest);

    const binary = await BinaryStore.Binary.create({
      file: logo,
      collection: Config.BINARY_COLLECTION.CLUB,
      type: Config.BINARY_TYPE.LOGO,
    });

    let updated;
    try {
      updated = await super.update({ ...rest, logoId: binary.id, logoUri: binary.uri });
    } catch (e) {
      await this._deleteBinary(binary.id);
      throw e;
    }

    if (current.logoId) await this._deleteBinary(current.logoId);
    await teamDao.updateLogoUriByClub(updated.id, updated.logoUri);
    return updated;
  }

  async delete(id) {
    // Klub smazaný zpod týmu by osiřel clubId -- stejná ochrana jako u osoby
    // (server/person/crud.js), jen na druhé straně vazby.
    const inUse = await teamDao.find({ clubId: id }, { pageSize: 1 });
    if (inUse.length) {
      throw new CoreError("Club is referenced by a team", {
        status: 400,
        code: `${Config.ERROR_PREFIX}/club/inUse`,
        paramMap: { id },
      });
    }

    const current = await this._get(id).catch(() => null);
    await super.delete(id);
    if (current?.logoId) await this._deleteBinary(current.logoId);
  }

  /** Úklid binárky nesmí shodit operaci, která už v databázi proběhla. */
  async _deleteBinary(id) {
    try {
      await BinaryStore.Binary.delete(id);
    } catch (e) {
      console.error("[club] logo binary cannot be deleted", id, e?.message ?? e);
    }
  }
}

export default new ClubCrud();
