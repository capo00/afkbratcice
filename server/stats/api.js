import matchDao from "../match/dao.js";
import seasonDao from "../season/dao.js";
import teamDao from "../team/dao.js";
import { computeTable } from "../services/table.js";
import { listPlayerStats, getPlayerStats } from "../services/stats.js";
import { validate, shape, mongoId } from "../services/validators.js";
import { getYearFrom } from "../services/season.js";
import { loadHiddenAgeList, loadHiddenTeamIdSet } from "../services/hidden-teams.js";

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
    fn: async ({ dtoIn, identity }) => {
      const season = await resolveSeason(dtoIn);
      // Statistiky dětí bez jmen: rozhoduje věk sezóny, nebo tým, na který se ptá.
      const hiddenAgeList = await loadHiddenAgeList();
      const hiddenTeamIdSet = await loadHiddenTeamIdSet(hiddenAgeList);
      const hidden = hiddenAgeList.includes(season?.age) || (dtoIn.teamId ? hiddenTeamIdSet.has(dtoIn.teamId) : false);
      const itemList = await listPlayerStats({ seasonId: season?.id, teamId: dtoIn.teamId, hidden, identity });
      return { itemList };
    },
  },

  "stats/getPlayerStats": {
    method: "get",
    validator: validate(shape({ playerId: mongoId().isRequired() })),
    fn: ({ dtoIn }) => getPlayerStats(dtoIn),
  },
};
