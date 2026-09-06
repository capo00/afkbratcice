import { Crud, BinaryStore } from "caio-server";
import dao from "./dao.js";
import Config from "../config.js";

/**
 * Logo týmu leží v kolekci `team` BinaryStore a tým si drží denormalizované `logoUri`
 * (klient tak nepotřebuje druhý dotaz). Postup převzatý z v1 `team-abl.js`, včetně
 * kompenzace: když zápis do Monga selže, nahraná binárka se uklidí -- jinak by
 * v bucketu zůstávaly osiřelé soubory.
 */
class TeamCrud extends Crud {
  constructor() {
    super("team", dao);
  }

  async list({ age, own, idList, pageInfo } = {}) {
    return (await dao.listByFilter({ age, own, idList }, pageInfo)).map((item) => this._getData(item));
  }

  async create(data) {
    const { logo, ...rest } = data;
    let binary;

    if (logo) {
      binary = await BinaryStore.Binary.create({
        file: logo,
        collection: Config.BINARY_COLLECTION.TEAM,
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
      return super.update({ ...rest, logoId: null, logoUri: null });
    }

    if (!logo) return super.update(rest);

    const binary = await BinaryStore.Binary.create({
      file: logo,
      collection: Config.BINARY_COLLECTION.TEAM,
      type: Config.BINARY_TYPE.LOGO,
    });

    let updated;
    try {
      // logoUri se MUSÍ přepsat: každá změna obsahu binárky dostane nové uri, takže by
      // jinak zůstalo viset staré a obrázek by se rozbil.
      updated = await super.update({ ...rest, logoId: binary.id, logoUri: binary.uri });
    } catch (e) {
      await this._deleteBinary(binary.id);
      throw e;
    }

    if (current.logoId) await this._deleteBinary(current.logoId);
    return updated;
  }

  async delete(id) {
    const current = await this._get(id);
    await super.delete(id);
    if (current?.logoId) await this._deleteBinary(current.logoId);
  }

  /** Úklid binárky nesmí shodit operaci, která už v databázi proběhla. */
  async _deleteBinary(id) {
    try {
      await BinaryStore.Binary.delete(id);
    } catch (e) {
      console.error("[team] logo binary cannot be deleted", id, e?.message ?? e);
    }
  }
}

export default new TeamCrud();
