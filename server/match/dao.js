import { Dao } from "caio-server";
import { invalidateHighlights } from "../services/highlights-cache.js";

class MatchDao extends Dao {
  constructor() {
    super("afk_match");
  }

  createIndexes() {
    return Promise.all([
      // Částečný schválně: stejná dvojice může v jednom roce sehrát víc PŘÁTELSKÝCH
      // zápasů. Ty proto mají `round: null` -- crud.js prázdný řetězec normalizuje --
      // a $type: "string" je z indexu vynechá. ($ne tady použít nejde, Mongo ho
      // v partialFilterExpression nepodporuje.)
      //
      // Kolo je v klíči od 2026-10-26: okresní soutěže se hrají i trojkolově, takže stejná
      // dvojice se stejným domácím týmem se v jedné sezóně potká dvakrát (v0: Chotusice B –
      // AFK Bratčice v 5. a 18. kole 2022/23). Starý index bez kola maže tools/migrate-v0.js.
      super.createIndex(
        { seasonId: 1, homeTeamId: 1, guestTeamId: 1, round: 1 },
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
  listByFilter(
    { seasonId, teamId, teamIdList, opponentId, homeTeamId, guestTeamId, playerId, round, state, dateFrom, dateTo } = {},
    pageInfo,
    order = "asc",
  ) {
    const filter = {};
    if (seasonId) filter.seasonId = seasonId;
    // Konkrétní strana hřiště (filtr administrace); `teamId` naopak bere obě.
    if (homeTeamId) filter.homeTeamId = homeTeamId;
    if (guestTeamId) filter.guestTeamId = guestTeamId;
    if (round) filter.round = round;
    if (state) filter.state = state;
    // Zápasy, v jejichž sestavě hráč je -- profil hráče. Index na `playerList.playerId`
    // tu je od začátku kvůli agregaci statistik, jen ho neměl kdo použít.
    if (playerId) filter["playerList.playerId"] = playerId;

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

    // `_id` jako druhé kritérium: dva zápasy se stejným výkopem (běžné -- celé kolo se
    // hraje v sobotu v 15:00) jsou pro Mongo shodné klíče a jejich pořadí pak není nijak
    // dané. To rozbíjí stránkování (řádek se může zopakovat i vypadnout) a `asc`/`desc`
    // pak nejsou opačné. `_id` je vždycky unikátní, takže řazení dorovná.
    const direction = order === "desc" ? -1 : 1;
    return this.find(filter, pageInfo, { time: direction, _id: direction });
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

  /**
   * Zápasy týmu pro Zajímavosti: jen odehrané soutěžní (stejný filtr jako `services/stats.js`),
   * bez `sys` a interního odjezdu. Mongo `$or` rozloží na indexy `homeTeamId_1_time_-1`
   * a `guestTeamId_1_time_-1`.
   */
  listPlayedByTeam(teamId) {
    return this.find(
      { $or: [{ homeTeamId: teamId }, { guestTeamId: teamId }], round: { $type: "string" }, homeGoals: { $ne: null } },
      { pageSize: 10000 },
      { time: 1 },
      { sys: 0, departureTime: 0 },
    );
  }

  // Každý zápis zápasu zneplatní cache Zajímavostí (services/highlights-cache.js). Tady, ne
  // v crud.js: crud zapisuje přes `super.update` z několika míst (výsledek, sestava, úprava)
  // a všechna vedou sem.
  async create(data) {
    const result = await super.create(data);
    invalidateHighlights();
    return result;
  }

  async createMany(dataList) {
    const result = await super.createMany(dataList);
    invalidateHighlights();
    return result;
  }

  async update(data) {
    const result = await super.update(data);
    invalidateHighlights();
    return result;
  }

  async delete(id) {
    await super.delete(id);
    invalidateHighlights();
  }

  async deleteMany(idList) {
    await super.deleteMany(idList);
    invalidateHighlights();
  }
}

export default new MatchDao();
