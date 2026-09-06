import { Dao } from "caio-server";

class MatchDao extends Dao {
  constructor() {
    super("match");
  }

  createIndexes() {
    return Promise.all([
      // Částečný schválně: stejná dvojice může v jednom roce sehrát víc PŘÁTELSKÝCH
      // zápasů. Ty proto mají `round: null` -- crud.js prázdný řetězec normalizuje --
      // a $type: "string" je z indexu vynechá. ($ne tady použít nejde, Mongo ho
      // v partialFilterExpression nepodporuje.)
      super.createIndex(
        { seasonId: 1, homeTeamId: 1, guestTeamId: 1 },
        { unique: true, partialFilterExpression: { round: { $type: "string" } } },
      ),
      super.createIndex({ time: -1 }),
      super.createIndex({ seasonId: 1, round: 1 }),
      super.createIndex({ homeTeamId: 1, time: -1 }),
      super.createIndex({ guestTeamId: 1, time: -1 }),
      super.createIndex({ "playerList.playerId": 1 }),
    ]);
  }

  /**
   * Jediný list se všemi filtry -- kolo v soutěži, program víkendu i vzájemné zápasy
   * jsou jen jiné kombinace parametrů, ne vlastní use casy (design/api.md, 2.3).
   */
  listByFilter({ seasonId, teamId, teamIdList, opponentId, round, state, dateFrom, dateTo } = {}, pageInfo, order = "asc") {
    const filter = {};
    if (seasonId) filter.seasonId = seasonId;
    if (round) filter.round = round;
    if (state) filter.state = state;

    if (teamId && opponentId) {
      // Dvojice v obou orientacích = vzájemné zápasy.
      filter.$or = [
        { homeTeamId: teamId, guestTeamId: opponentId },
        { homeTeamId: opponentId, guestTeamId: teamId },
      ];
    } else if (teamId) {
      filter.$or = [{ homeTeamId: teamId }, { guestTeamId: teamId }];
    } else if (teamIdList?.length) {
      filter.$or = [{ homeTeamId: { $in: teamIdList } }, { guestTeamId: { $in: teamIdList } }];
    }

    if (dateFrom || dateTo) {
      filter.time = {};
      if (dateFrom) filter.time.$gte = dateFrom;
      if (dateTo) filter.time.$lte = dateTo;
    }

    return this.find(filter, pageInfo, { time: order === "desc" ? -1 : 1 });
  }

  /** Poslední odehraný zápas týmu. */
  async findLast(teamId) {
    const list = await this.find(
      { $or: [{ homeTeamId: teamId }, { guestTeamId: teamId }], homeGoals: { $ne: null }, time: { $ne: null } },
      { pageSize: 1 },
      { time: -1 },
    );
    return list[0] ?? null;
  }

  /** Nejbližší zápas týmu, který se ještě nehrál. */
  async findNext(teamId) {
    const list = await this.find(
      { $or: [{ homeTeamId: teamId }, { guestTeamId: teamId }], time: { $gte: new Date().toISOString() } },
      { pageSize: 1 },
      { time: 1 },
    );
    return list[0] ?? null;
  }

  listBySeason(seasonId) {
    return this.find({ seasonId }, { pageSize: 1000 }, { time: 1 });
  }

  /** Základní Dao aggregate neumí -- statistiky hráčů ho potřebují. */
  aggregate(pipeline) {
    return this._exec(() => this.coll.aggregate(pipeline).toArray());
  }
}

export default new MatchDao();
