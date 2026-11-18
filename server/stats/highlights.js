import matchDao from "../match/dao.js";
import teamDao from "../team/dao.js";
import categoryDao from "../category/dao.js";
import rosterDao from "../roster/dao.js";
import seasonDao from "../season/dao.js";
import playerDao from "../player/dao.js";
import personDao from "../person/dao.js";
import { computeHighlights, collectRefs } from "../services/highlights.js";
import { getHighlights as getCached, setHighlights, highlightsGeneration } from "../services/highlights-cache.js";
import { personForIdentity } from "../services/hidden-names.js";
import { loadHiddenAgeList } from "../services/hidden-teams.js";
import { getYearFrom } from "../services/season.js";

// Načtení dat pro Zajímavosti (`stats/getHighlights`). Výpočet je v services/highlights.js.
//
// Dotazy (všechny přes existující indexy, nový není potřeba):
//   1. kategorie podle kódu (`code_1`) a náš tým v ní (`category_1_name_1`)
//   2. odehrané soutěžní zápasy týmu (`homeTeamId_1_time_-1` + `guestTeamId_1_time_-1`)
//   3. soupiska týmu (`teamId_1`) a sezóny ze zápasů (`_id`) -- souběžně
//   4. hráči, osoby a soupeři, na které výsledek odkazuje (`_id`) -- souběžně
// Výsledek se drží v paměti po kategoriích (services/highlights-cache.js); jména se skrývají až
// při odpovědi, protože záleží na volajícím.

/** Náš tým kategorie. Kdyby jich klub měl v jedné kategorii víc, bere se abecedně první. */
async function findOwnTeam(categoryCode) {
  const teamList = await teamDao.listByFilter({ categoryList: [categoryCode], own: true });
  return teamList[0] ?? null;
}

function seasonOut(season) {
  return season ? { id: season.id, yearFrom: season.yearFrom, competition: season.competition ?? null } : null;
}

async function loadHighlights(categoryCode) {
  const category = await categoryDao.findByCode(categoryCode);
  if (!category) return null;
  const categoryOut = { code: category.code, name: category.name, age: category.age ?? null };

  const team = await findOwnTeam(categoryCode);
  if (!team) return { category: categoryOut, team: null, highlights: null };

  const matchList = await matchDao.listPlayedByTeam(team.id);
  const seasonIdList = [...new Set(matchList.map((m) => m.seasonId).filter(Boolean))];
  const [rosterList, seasonList] = await Promise.all([
    rosterDao.listByFilter({ teamId: team.id }),
    seasonIdList.length ? seasonDao.listByIdList(seasonIdList) : Promise.resolve([]),
  ]);

  const seasonMap = new Map(seasonList.map((s) => [s.id, s]));
  const highlights = computeHighlights({
    matchList,
    teamId: team.id,
    rosterPlayerIdSet: new Set(rosterList.map((r) => r.playerId)),
    seasonMap,
    currentYearFrom: getYearFrom(),
  });
  if (!highlights) return { category: categoryOut, team: { id: team.id, name: team.name }, highlights: null };

  const { playerIdList, seasonIdList: usedSeasonIdList, teamIdList } = collectRefs(highlights);
  const [playerList, teamList] = await Promise.all([
    playerIdList.length ? playerDao.listByIdList(playerIdList) : Promise.resolve([]),
    teamIdList.length ? teamDao.listByIdList(teamIdList) : Promise.resolve([]),
  ]);
  const personIdList = [...new Set(playerList.map((p) => p.personId).filter(Boolean))];
  const personList = personIdList.length ? await personDao.listByIdList(personIdList) : [];
  const personMap = new Map(personList.map((p) => [p.id, p]));

  return {
    category: categoryOut,
    team: { id: team.id, name: team.name },
    highlights,
    // Číselníky, na které `highlights` odkazuje id. Osoba je tu celá, ořízne se při odpovědi.
    playerMap: Object.fromEntries(
      playerList.map((p) => [p.id, { id: p.id, position: p.position ?? null, person: personMap.get(p.personId) ?? null }]),
    ),
    seasonMap: Object.fromEntries(usedSeasonIdList.filter((id) => seasonMap.has(id)).map((id) => [id, seasonOut(seasonMap.get(id))])),
    teamMap: Object.fromEntries(teamList.map((t) => [t.id, { id: t.id, name: t.name, logoUri: t.logoUri ?? null }])),
  };
}

/** Osoby tak, jak je smí vidět volající (jména dětí, services/hidden-names.js), bez kontaktů. */
async function forIdentity(result, identity) {
  if (!result?.playerMap) return result;
  const hidden = (await loadHiddenAgeList()).includes(result.category.age);
  const playerMap = Object.fromEntries(
    Object.entries(result.playerMap).map(([id, player]) => {
      const person = personForIdentity(player.person, identity, hidden);
      return [
        id,
        {
          ...player,
          person: person ? { id: person.id, name: person.name ?? null, surname: person.surname ?? null } : null,
        },
      ];
    }),
  );
  return { ...result, playerMap };
}

/**
 * @returns `null` pro neznámou kategorii; jinak `{ category, team, highlights, playerMap,
 *          seasonMap, teamMap }`, kde `team` a `highlights` jsou `null`, když klub v kategorii
 *          tým nemá nebo ten ještě nic neodehrál
 */
async function getHighlights({ category }, identity) {
  let result = getCached(category);
  if (result === undefined) {
    const fromGeneration = highlightsGeneration();
    result = await loadHighlights(category);
    // Neznámá kategorie se neukládá: klíč je z adresy, a cache by tak šla nafouknout náhodnými kódy.
    if (result) setHighlights(category, result, fromGeneration);
  }
  return forIdentity(result, identity);
}

export { getHighlights, loadHighlights };
