import matchDao from "../match/dao.js";
import seasonDao from "../season/dao.js";
import teamDao from "../team/dao.js";
import { computeTable } from "../services/table.js";
import { listPlayerStats, getPlayerStats } from "../services/stats.js";
import { validate, shape, mongoId } from "../services/validators.js";
import { getYearFrom } from "../services/season.js";

/** Sezónu lze zadat přímo, nebo ji dohledáme podle týmu v aktuálním ročníku. */
async function resolveSeason({ seasonId, teamId }) {
  if (seasonId) return seasonDao.get(seasonId);
  if (teamId) return seasonDao.findCurrentByTeam(getYearFrom(), teamId);
  return null;
}

export default {
  "stats/getTable": {
    method: "get",
    validator: validate(shape({ seasonId: mongoId(), teamId: mongoId() })),
    fn: async ({ dtoIn }) => {
      const season = await resolveSeason(dtoIn);
      if (!season) return { season: null, table: [] };

      const [matchList, teamList] = await Promise.all([
        matchDao.listBySeason(season.id),
        season.teamList?.length ? teamDao.listByIdList(season.teamList) : Promise.resolve([]),
      ]);

      return { season, table: computeTable(matchList, teamList, Boolean(season.hasPenalties)) };
    },
  },

  "stats/listPlayerStats": {
    method: "get",
    validator: validate(shape({ seasonId: mongoId(), teamId: mongoId() })),
    fn: async ({ dtoIn }) => {
      const season = await resolveSeason(dtoIn);
      const itemList = await listPlayerStats({ seasonId: season?.id, teamId: dtoIn.teamId });
      return { itemList };
    },
  },

  "stats/getPlayerStats": {
    method: "get",
    validator: validate(shape({ playerId: mongoId().isRequired() })),
    fn: ({ dtoIn }) => getPlayerStats(dtoIn),
  },
};
