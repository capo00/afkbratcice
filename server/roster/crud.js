import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import playerDao from "../player/dao.js";
import playerCrud from "../player/crud.js";
import personDao from "../person/dao.js";
import { overlaps, seasonRangeOf } from "../services/membership.js";

// Soupiska: hráč v týmu v období (`dao.js`). Výstup nese vloženého `player` (s `person`) a jeho
// `personId`, aby tabulka v administraci nemusela hráče dohledávat; jména dětí řeší
// `playerCrud._withPerson`.
//
// Zápis přijímá místo `playerId` i **`personId`** (review 2026-11-12, S14): administrace
// vybírá osobu, protože nová osoba kartu hráče ještě nemá a ze seznamu karet by ji do týmu
// dát nešlo. Kartu najde, nebo založí `_resolvePlayer`.

class RosterCrud extends Crud {
  constructor() {
    super("roster", dao);
  }

  async _withPlayer(rowList, identity, { teamId } = {}) {
    const playerIdList = [...new Set(rowList.map((r) => r.playerId).filter(Boolean))];
    const players = playerIdList.length
      ? await playerCrud._withPerson((await playerDao.listByIdList(playerIdList)).map((p) => playerCrud._getData(p)), identity, {
          teamId,
        })
      : [];
    return rowList.map((row) => {
      const player = players.find((p) => p.id === row.playerId) ?? null;
      return { ...row, personId: player?.personId ?? null, player };
    });
  }

  async list({ teamId, playerId, active, seasonId } = {}, identity) {
    const range = seasonId ? await seasonRangeOf(seasonId) : undefined;
    if (range === null) return [];
    const rowList = (await dao.listByFilter({ teamId, playerId, active, range })).map((r) => this._getData(r));
    return this._withPlayer(rowList, identity, { teamId });
  }

  async get(id, identity) {
    const [row] = await this._withPlayer([this._getData(await this._get(id))], identity);
    return row;
  }

  async create(data, identity) {
    const row = await this._resolvePlayer(this._checkPeriod(this._normalize(data)));
    await this._check(row);
    const [out] = await this._withPlayer([await super.create(row)], identity, { teamId: row.teamId });
    return out;
  }

  /** Tým se nemění (`teamId` v dtoIn update není): jiný tým = jiné působení, nový záznam. */
  async update(data, identity) {
    const current = this._getData(await this._get(data.id));
    const row = await this._resolvePlayer(this._checkPeriod(this._normalize({ ...current, ...data, teamId: current.teamId })));
    await this._check(row);
    const [out] = await this._withPlayer([await super.update(row)], identity, { teamId: row.teamId });
    return out;
  }

  _normalize({ dateFrom, dateTo, player, ...rest }) {
    return { ...rest, dateFrom: dateFrom || null, dateTo: dateTo || null };
  }

  /** Obrácené období odmítne dřív, než `_resolvePlayer` založí kartu, která by pak zbyla. */
  _checkPeriod(row) {
    if (row.dateFrom && row.dateTo && row.dateFrom > row.dateTo) {
      throw this._error("invalidPeriod", "dateFrom is after dateTo");
    }
    return row;
  }

  /**
   * `personId` -> `playerId`: karta osoby, a když ji osoba ještě nemá, nová (jen s osobou; post
   * a poznámka se doplní na kartě). `personId` má přednost před `playerId` -- při úpravě přijde
   * z formuláře změněná osoba a k ní staré `playerId` ze záznamu.
   */
  async _resolvePlayer({ personId, ...row }) {
    if (!personId) return row;
    const existing = await playerDao.findByPersonId(personId);
    if (existing) return { ...row, playerId: String(existing.id) };

    if (!(await personDao.get(personId).catch(() => null))) {
      throw this._error("unknownPerson", "Person does not exist", { personId });
    }
    try {
      return { ...row, playerId: String((await playerDao.create({ personId })).id) };
    } catch (e) {
      // Souběh: kartu mezitím založil jiný zápis (unikátní index na `personId`).
      const raced = await playerDao.findByPersonId(personId);
      if (raced) return { ...row, playerId: String(raced.id) };
      throw e;
    }
  }

  async _check(row) {
    const { playerId, teamId } = row;
    if (!playerId || !(await playerDao.get(playerId).catch(() => null))) {
      throw this._error("unknownPlayer", "Player does not exist", { playerId: playerId ?? null });
    }

    // Týž hráč nesmí být v témž týmu dvakrát ve stejnou dobu (design/data-model.md, sekce 6.1).
    const sameTeam = await dao.listByFilter({ playerId, teamId });
    const clash = sameTeam.find((other) => String(other.id) !== String(row.id) && overlaps(other, row));
    if (clash) {
      throw this._error("overlap", "The player is already in this team in an overlapping period", {
        id: String(clash.id),
        dateFrom: clash.dateFrom ?? null,
        dateTo: clash.dateTo ?? null,
      });
    }
  }

  _error(code, message, paramMap) {
    return new CoreError(message, { status: 400, code: CoreError.code("roster", code), paramMap });
  }
}

export default new RosterCrud();
