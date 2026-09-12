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

  // Vrací se týž tvar jako z `get`, tedy **doplněný o výchozí hodnoty**. Klient si po
  // uložení nahradí data tím, co přišlo odsud; bez merge by z nich zmizela pole, která
  // formulář neposílá a uložený dokument je nemá (`socialList`, `fileCategoryList`, ...)
  // a vypadalo by to, že se nastavení uložením vynulovalo.
  async update(data) {
    const found = await dao.findSingleton();
    const { id, ...rest } = data;
    const saved = found ? await dao.update({ id: found.id, ...rest }) : await dao.create(rest);
    return { ...Config.DEFAULT_APP_CONFIG, ...this._getData(saved) };
  }
}

export default new AppConfigCrud();
