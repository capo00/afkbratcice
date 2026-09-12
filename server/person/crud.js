import { Crud, Error as CoreError, BinaryStore } from "caio-server";
import dao from "./dao.js";
import playerDao from "../player/dao.js";
import coachDao from "../coach/dao.js";
import Config from "../config.js";
import { hasRole } from "../services/authorize.js";

// Kontaktní údaje jsou neveřejné. Filtruje je tahle vrstva, ne jednotlivé use casy --
// osoba se vrací i z player/list a match/get, takže filtr v API by šel obejít.
const PRIVATE_FIELD_LIST = ["birthdate", "email", "phone", "note"];

class PersonCrud extends Crud {
  constructor() {
    super("person", dao);
  }

  /** @param identity volající; `self` (vlastní záznam) vidí svoje údaje taky. */
  static forIdentity(person, identity) {
    if (!person) return person;
    const isSelf = Boolean(identity?.identity) && person.identity === identity.identity;
    if (isSelf || hasRole(identity, Config.CONTENT)) return person;

    const result = { ...person };
    for (const field of PRIVATE_FIELD_LIST) delete result[field];
    return result;
  }

  async list({ query, idList, pageInfo } = {}, identity) {
    const itemList = await dao.listByFilter({ query, idList }, pageInfo);
    return itemList.map((item) => PersonCrud.forIdentity(this._getData(item), identity));
  }

  async get(id, identity) {
    return PersonCrud.forIdentity(this._getData(await this._get(id)), identity);
  }

  // Zápis filtruje stejně jako čtení: `create` smí volat i `teamEditor` bez role CONTENT
  // (`anyTeamEditor` v api.js) a ten by jinak dostal zpátky objekt s poli, která mu
  // `person/list` odřízne -- tvar položky by se pak lišil řádek od řádku. Platí pravidlo
  // z hlavičky souboru: filtruje tahle vrstva, ne jednotlivé use casy.
  async create(data, identity) {
    const { photo, ...rest } = data;
    let binary;
    if (photo) {
      binary = await BinaryStore.Binary.create({ file: photo, collection: Config.BINARY_COLLECTION.PERSON });
    }
    try {
      const created = await super.create({ ...rest, photoId: binary?.id ?? null, photoUri: binary?.uri ?? null });
      return PersonCrud.forIdentity(created, identity);
    } catch (e) {
      if (binary) await this._deleteBinary(binary.id);
      throw e;
    }
  }

  async update(data, identity) {
    const { photo, ...rest } = data;
    if (photo === undefined) return PersonCrud.forIdentity(await super.update(rest), identity);

    const current = await this._get(data.id);
    if (photo === null) {
      if (current.photoId) await this._deleteBinary(current.photoId);
      return PersonCrud.forIdentity(await super.update({ ...rest, photoId: null, photoUri: null }), identity);
    }

    const binary = await BinaryStore.Binary.create({ file: photo, collection: Config.BINARY_COLLECTION.PERSON });
    const updated = await super.update({ ...rest, photoId: binary.id, photoUri: binary.uri });
    if (current.photoId) await this._deleteBinary(current.photoId);
    return PersonCrud.forIdentity(updated, identity);
  }

  async delete(id) {
    // Osoba je sdílená mezi hráčem a trenérem; smazat ji zpod nich by osiřel personId.
    const [players, coaches] = await Promise.all([
      playerDao.find({ personId: id }, { pageSize: 1 }),
      coachDao.find({ personId: id }, { pageSize: 1 }),
    ]);
    if (players.length || coaches.length) {
      throw new CoreError("Person is referenced by a player or a coach", {
        status: 400,
        code: `${Config.ERROR_PREFIX}/person/inUse`,
        paramMap: { id },
      });
    }

    const current = await this._get(id).catch(() => null);
    await super.delete(id);
    if (current?.photoId) await this._deleteBinary(current.photoId);
  }

  // Pozor na dva různé významy `identity`: v dtoIn je to kód identity, který se osobě
  // přiřazuje, druhý parametr je volající. Filtruje se podle volajícího, zapisuje ten z dtoIn.
  async linkIdentity({ id, identity }, callerIdentity) {
    return PersonCrud.forIdentity(await super.update({ id, identity }), callerIdentity);
  }

  async _deleteBinary(id) {
    try {
      await BinaryStore.Binary.delete(id);
    } catch (e) {
      console.error("[person] photo binary cannot be deleted", id, e?.message ?? e);
    }
  }
}

const instance = new PersonCrud();
export default instance;
export { PersonCrud };
