import { Crud } from "caio-server";
import dao from "./dao.js";
import rosterDao from "../roster/dao.js";
import personDao from "../person/dao.js";
import { PersonCrud } from "../person/crud.js";
import { personForIdentity, isPlayerHidden } from "../services/hidden-names.js";
import { loadHiddenTeamIdSet } from "../services/hidden-teams.js";
import { seasonRangeOf } from "../services/membership.js";
import { withTeamList } from "../services/roster.js";

// Hráč je **karta osoby jako hráče**: osoba, post, poznámka. Na id hráče stojí sestavy zápasů,
// statistiky i stránka hráče, proto zůstává jeden záznam na osobu. Kdy byl v jakém týmu, je
// soupiska (`afk_roster`, `roster/*`); `teamList` ve výstupu je z ní odvozený (services/roster.js).

class PlayerCrud extends Crud {
  constructor() {
    super("player", dao);
  }

  /**
   * Seznam i detail vrací vloženou osobu -- soupiska by jinak byla n+1 dotazů -- a odvozený
   * `teamList`.
   *
   * Jména dětí (services/hidden-names.js): na soupisce týmu (`teamId`) rozhoduje ten tým,
   * jinde otevřené působení hráče ve skrytém týmu.
   */
  async _withPerson(playerList, identity, { teamId } = {}) {
    const personIdList = [...new Set(playerList.map((p) => p.personId).filter(Boolean))];
    const [withTeams, persons, hiddenTeamIdSet] = await Promise.all([
      withTeamList(playerList),
      personIdList.length ? personDao.listByIdList(personIdList) : [],
      loadHiddenTeamIdSet(),
    ]);
    return withTeams.map((player) => {
      const hidden = teamId ? hiddenTeamIdSet.has(teamId) : isPlayerHidden(player, hiddenTeamIdSet);
      const person = persons.find((x) => x.id === player.personId) ?? null;
      return { ...player, person: personForIdentity(PersonCrud.forIdentity(person, identity), identity, hidden) };
    });
  }

  /** `teamId` = soupiska týmu (s `active` / `seasonId` v čase), jinak všichni hráči. */
  async list({ teamId, active, seasonId, idList, pageInfo } = {}, identity) {
    const range = seasonId ? await seasonRangeOf(seasonId) : undefined;
    if (range === null) return [];

    let playerList;
    if (idList) {
      playerList = await dao.listByIdList(idList);
    } else if (teamId) {
      const rowList = await rosterDao.listByFilter({ teamId, active, range });
      const playerIdList = [...new Set(rowList.map((r) => r.playerId))];
      playerList = playerIdList.length ? await dao.listByIdList(playerIdList) : [];
    } else {
      playerList = await dao.find({}, pageInfo);
    }
    return this._withPerson(
      playerList.map((i) => this._getData(i)),
      identity,
      { teamId },
    );
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

  /** Se hráčem odchází i jeho soupiska -- záznam bez hráče by nikdo nepřečetl. */
  async delete(id) {
    const rowList = await rosterDao.listByFilter({ playerId: id });
    await super.delete(id);
    if (rowList.length) await rosterDao.deleteMany(rowList.map((r) => r.id));
  }
}

export default new PlayerCrud();
