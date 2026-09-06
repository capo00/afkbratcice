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

  /** Přidá členství v týmu; existující otevřené členství ve stejném týmu nechá být. */
  async addTeam({ id, teamId, dateFrom = null }) {
    const current = await this._get(id);
    const teamList = current.teamList ?? [];
    if (teamList.some((t) => t.id === teamId && !t.dateTo)) return this._getData(current);
    return super.update({ id, teamList: [...teamList, { id: teamId, dateFrom, dateTo: null }] });
  }

  /** Uzavře členství -- záznam se nemaže, aby zůstala historie soupisek. */
  async endTeam({ id, teamId, dateTo = new Date().toISOString().slice(0, 10) }) {
    const current = await this._get(id);
    const teamList = (current.teamList ?? []).map((t) =>
      t.id === teamId && !t.dateTo ? { ...t, dateTo } : t,
    );
    return super.update({ id, teamList });
  }
}

export default new PlayerCrud();
