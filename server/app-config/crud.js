import { Crud } from "caio-server";
import dao from "./dao.js";
import Config from "../config.js";

/**
 * Konfigurace, kterou mění redakce za běhu. Kategorie mužstev se sem NEPÍŠOU -- ty se
 * odvozují ze sezón (season/listCurrent); tady je jen jejich pořadí a výjimky.
 */
class AppConfigCrud extends Crud {
  constructor() {
    super("appConfig", dao);
  }

  async get() {
    const found = await dao.findSingleton();
    // Prázdná kolekce vrací výchozí objekt, ne 404 -- appka musí nastartovat i bez ní.
    return { ...Config.DEFAULT_APP_CONFIG, ...(found ? this._getData(found) : {}) };
  }

  async update(data) {
    const found = await dao.findSingleton();
    const { id, ...rest } = data;
    if (!found) return this._getData(await dao.create(rest));
    return this._getData(await dao.update({ id: found.id, ...rest }));
  }
}

export default new AppConfigCrud();
