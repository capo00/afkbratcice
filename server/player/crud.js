import { Crud } from "caio-server";
import dao from "./dao.js";
import personDao from "../person/dao.js";
import { PersonCrud } from "../person/crud.js";

class PlayerCrud extends Crud {
  constructor() {
    super("player", dao);
  }

  /** Seznam i detail vrací vloženou osobu -- soupiska by jinak byla n+1 dotazů. */
  async _withPerson(playerList, identity) {
    const personIdList = [...new Set(playerList.map((p) => p.personId).filter(Boolean))];
    const persons = personIdList.length ? await personDao.listByIdList(personIdList) : [];
    return playerList.map((player) => ({
      ...player,
      person: PersonCrud.forIdentity(persons.find((x) => x.id === player.personId) ?? null, identity),
    }));
  }

  async list({ teamId, active, idList, pageInfo } = {}, identity) {
    const itemList = (await dao.listByFilter({ teamId, active, idList }, pageInfo)).map((i) => this._getData(i));
    return this._withPerson(itemList, identity);
  }

  async get(id, identity) {
    const player = this._getData(await this._get(id));
    const [withPerson] = await this._withPerson([player], identity);
    return withPerson;
  }

  /**
   * Zápisové operace musí vracet **týž tvar jako `list`/`get`**, tedy včetně vložené
   * `person`. Klient (`useDataList`) po zápisu nahradí položku v seznamu tím, co přišlo
   * ze serveru -- bez `person` by ve sloupci „Osoba" zůstalo holé id.
   */
  async create(data, identity) {
    const [withPerson] = await this._withPerson([await super.create(data)], identity);
    return withPerson;
  }

  async update(data, identity) {
    const [withPerson] = await this._withPerson([await super.update(data)], identity);
    return withPerson;
  }

  /** Přidá členství v týmu; existující otevřené členství ve stejném týmu nechá být. */
  async addTeam({ id, teamId, dateFrom = null }, identity) {
    const current = await this._get(id);
    const teamList = current.teamList ?? [];
    // I "nic se nezměnilo" musí vrátit stejný tvar jako zápis, který proběhl.
    if (teamList.some((t) => t.id === teamId && !t.dateTo)) {
      const [withPerson] = await this._withPerson([this._getData(current)], identity);
      return withPerson;
    }
    return this.update({ id, teamList: [...teamList, { id: teamId, dateFrom, dateTo: null }] }, identity);
  }

  /** Uzavře členství -- záznam se nemaže, aby zůstala historie soupisek. */
  async endTeam({ id, teamId, dateTo = new Date().toISOString().slice(0, 10) }, identity) {
    const current = await this._get(id);
    const teamList = (current.teamList ?? []).map((t) =>
      t.id === teamId && !t.dateTo ? { ...t, dateTo } : t,
    );
    return this.update({ id, teamList }, identity);
  }
}

export default new PlayerCrud();
