import { Dao } from "caio-server";
import { membershipCondition } from "../services/membership.js";

// Soupiska: **jeden záznam = jeden hráč v jednom týmu v jednom období** (design/data-model.md,
// sekce 6.1): `{ playerId, teamId, dateFrom, dateTo }`, `dateTo: null` = trvá. Do 2026-11 bylo
// členství vnořené v hráči (`player.teamList`, převod: tools/migrate-player-roster.js).

class RosterDao extends Dao {
  constructor() {
    super("afk_roster");
  }

  createIndexes() {
    return Promise.all([super.createIndex({ teamId: 1 }), super.createIndex({ playerId: 1 })]);
  }

  /**
   * @param teamId    soupiska tohoto týmu
   * @param playerId  působení tohoto hráče
   * @param active    jen působení, která trvají dnes
   * @param range     `{ from, to }` = působení zasahuje do období (sezóny)
   */
  listByFilter({ teamId, playerId, active, range } = {}, pageInfo = { pageSize: 10000 }) {
    const match = { ...(teamId ? { teamId } : null), ...(playerId ? { playerId } : null) };
    return this.find(membershipCondition(match, { active, range }), pageInfo);
  }

  /** Všechna působení hráčů ze seznamu (odvozené `player.teamList`). */
  listByPlayerIdList(playerIdList) {
    if (!playerIdList?.length) return Promise.resolve([]);
    return this.find({ playerId: { $in: playerIdList } }, { pageSize: 10000 });
  }
}

export default new RosterDao();
