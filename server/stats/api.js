import matchDao from "../match/dao.js";
import seasonDao from "../season/dao.js";
import teamDao from "../team/dao.js";
import { computeTable } from "../services/table.js";
import { listPlayerStats, getPlayerStats, hiddenNamesRule } from "../services/stats.js";
import { validate, shape, string, mongoId } from "../services/validators.js";
import { getHighlights } from "./highlights.js";
import { getYearFrom } from "../services/season.js";
import { loadHiddenAgeList, loadHiddenTeamIdSet } from "../services/hidden-teams.js";

// Kategorie Zajímavostí, když adresa žádnou neříká.
const DEFAULT_HIGHLIGHTS_CATEGORY = "men-a";

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
      // Children's statistics go without names (services/stats.js `hiddenNamesRule`).
      const hiddenAgeList = await loadHiddenAgeList();
      const hiddenTeamIdSet = await loadHiddenTeamIdSet(hiddenAgeList);
      const hidden = hiddenNamesRule({ ...dtoIn, season, hiddenAgeList, hiddenTeamIdSet });
      const itemList = await listPlayerStats({ seasonId: season?.id, teamId: dtoIn.teamId, hidden, identity });
      return { itemList };
    },
  },

  "stats/getPlayerStats": {
    method: "get",
    validator: validate(shape({ playerId: mongoId().isRequired() })),
    fn: ({ dtoIn }) => getPlayerStats(dtoIn),
  },

  // Zajímavosti jedné kategorie za celou historii (stránka Klub → Zajímavosti). Výsledek se drží
  // v paměti a zneplatní ho zápis zápasu (stats/highlights.js, services/highlights-cache.js).
  // Bez kategorie muži A: zatím je stránka jen pro ně (Caio 2026-11-18).
  "stats/getHighlights": {
    method: "get",
    validator: validate(shape({ category: string(1, 32) })),
    fn: async ({ dtoIn, identity }) =>
      (await getHighlights({ category: dtoIn.category || DEFAULT_HIGHLIGHTS_CATEGORY }, identity)) ?? {
        category: null,
        team: null,
        highlights: null,
      },
  },
};
