import { countsTowardsTable } from "./table.js";

// Zajímavosti (stránka Klub → Zajímavosti, review 2026-11-12 Top 10 #9): bilance, rekordy, série
// a žebříčky hráčů jednoho našeho týmu za celou historii.
//
// Čistá funkce bez databáze, aby šla testovat (server/test/highlights.test.js); data načítá
// `stats/highlights.js`. Počítá se v paměti, ne agregací v Mongu: série, Iron man, čistá konta
// v řadě a obraty potřebují zápasy popořadě, což pipeline umí jen přes `$setWindowFields`
// a mnohem složitěji. Součty by agregací šly, ale zápasy se kvůli sériím načítají stejně.
//
// Pravidla jsou stejná jako u tabulky a sezónních statistik: jen odehrané soutěžní zápasy
// (`countsTowardsTable`), rozstřel je remíza (výsledek je podle gólů).

// Celá sezóna má aspoň tolik zápasů -- covidová 2020/21 jich měla 6 a „nejhorší sezóna“
// by pak byla náhoda.
const MIN_SEASON_MATCHES = 10;
// „S ním vyhráváme“: pod tím je podíl výher spíš náhoda.
const MIN_WIN_WITH_APPEARANCES = 30;
const MIN_GOALKEEPER_STARTS = 10;
const CLUB_APPEARANCES = 100;
const TOP_SCORER_COUNT = 10;
const RANK_COUNT = 5;
const LAST_COUNT = 5;

const RESULT = { WIN: "W", DRAW: "D", LOSS: "L" };

function emptyBalance() {
  return { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };
}

function addToBalance(balance, game) {
  balance.played++;
  if (game.result === RESULT.WIN) balance.wins++;
  else if (game.result === RESULT.DRAW) balance.draws++;
  else balance.losses++;
  balance.goalsFor += game.goalsFor;
  balance.goalsAgainst += game.goalsAgainst;
  return balance;
}

function pointsPerMatch(balance) {
  return balance.played ? Math.round(((balance.wins * 3 + balance.draws) / balance.played) * 100) / 100 : 0;
}

/** Zápas, jak ho vrací dtoOut: bez sestavy a interních polí. */
function matchRef({ match }) {
  return {
    id: match.id,
    time: match.time,
    seasonId: match.seasonId ?? null,
    homeTeamId: match.homeTeamId,
    guestTeamId: match.guestTeamId,
    homeGoals: match.homeGoals,
    guestGoals: match.guestGoals,
    homeGoalsHalf: match.homeGoalsHalf ?? null,
    guestGoalsHalf: match.guestGoalsHalf ?? null,
  };
}

/** Zápas z pohledu našeho týmu. */
function toGame(match, teamId) {
  const home = match.homeTeamId === teamId;
  const goalsFor = home ? match.homeGoals : match.guestGoals;
  const goalsAgainst = home ? match.guestGoals : match.homeGoals;
  const halfFor = home ? match.homeGoalsHalf : match.guestGoalsHalf;
  const halfAgainst = home ? match.guestGoalsHalf : match.homeGoalsHalf;
  const result = goalsFor > goalsAgainst ? RESULT.WIN : goalsFor < goalsAgainst ? RESULT.LOSS : RESULT.DRAW;
  return {
    match,
    home,
    goalsFor,
    goalsAgainst,
    halfFor: Number.isFinite(halfFor) && Number.isFinite(halfAgainst) ? halfFor : null,
    halfAgainst: Number.isFinite(halfFor) && Number.isFinite(halfAgainst) ? halfAgainst : null,
    result,
    playerList: match.playerList ?? [],
  };
}

/** Nejdelší řada zápasů splňujících `pred`: `{ length, from, to }` (časy výkopu), nebo `null`. */
function longestRun(gameList, pred) {
  let best = null;
  let start = null;
  let length = 0;
  for (const game of gameList) {
    if (!pred(game)) {
      length = 0;
      continue;
    }
    if (!length) start = game;
    length++;
    if (!best || length > best.length) best = { length, from: start.match.time, to: game.match.time };
  }
  return best;
}

/** Kolik posledních zápasů v řadě splňuje `pred`. */
function currentRun(gameList, pred) {
  let length = 0;
  for (let i = gameList.length - 1; i >= 0 && pred(gameList[i]); i--) length++;
  return length;
}

/** První položka po seřazení; `compare` jako u `sort`. */
function best(list, compare) {
  return list.length ? [...list].sort(compare)[0] : null;
}

function emptyPlayer(playerId) {
  return {
    playerId,
    appearances: 0,
    goals: 0,
    yellowCards: 0,
    redCards: 0,
    wins: 0,
    goalkeeperStarts: 0,
    cleanSheets: 0,
    goalsBySeason: new Map(),
  };
}

const isOurGoalkeeper = (entry, ourPlayer) => ourPlayer(entry.playerId) && !entry.substitute && entry.positionDetail === "GK";

/**
 * @param matchList        zápasy týmu (obě strany hřiště), v libovolném pořadí
 * @param teamId           náš tým
 * @param rosterPlayerIdSet hráči, kteří kdy byli na soupisce týmu: sestava zápasu obsahuje
 *                         i soupeře, a ti do žebříčků nepatří
 * @param seasonMap        `Map(seasonId -> season)`; sezóny kvůli ročníku (`yearFrom`)
 * @param currentYearFrom  běžící ročník (`services/season.js` `getYearFrom`): ten se do rekordů
 *                         sezón nepočítá a král střelců v něm je jen průběžný
 * @returns dtoOut bez jmen: hráči jsou jen `playerId`, zápasy jen týmy jako id; doplňuje je
 *          `stats/highlights.js`
 */
function computeHighlights({ matchList, teamId, rosterPlayerIdSet, seasonMap = new Map(), currentYearFrom }) {
  const gameList = matchList
    .filter(countsTowardsTable)
    .filter((match) => match.homeTeamId === teamId || match.guestTeamId === teamId)
    .sort((a, b) => String(a.time).localeCompare(String(b.time)) || String(a.id).localeCompare(String(b.id)))
    .map((match) => toGame(match, teamId));

  if (!gameList.length) return null;

  // -- tým --
  const total = emptyBalance();
  const home = emptyBalance();
  const away = emptyBalance();
  const bySeason = new Map();
  for (const game of gameList) {
    addToBalance(total, game);
    addToBalance(game.home ? home : away, game);
    const seasonId = game.match.seasonId ?? null;
    if (!bySeason.has(seasonId)) bySeason.set(seasonId, emptyBalance());
    addToBalance(bySeason.get(seasonId), game);
  }

  const diff = (game) => game.goalsFor - game.goalsAgainst;
  const biggestWin = best(gameList.filter((g) => g.result === RESULT.WIN), (a, b) => diff(b) - diff(a) || b.goalsFor - a.goalsFor);
  const biggestLoss = best(gameList.filter((g) => g.result === RESULT.LOSS), (a, b) => diff(a) - diff(b) || b.goalsAgainst - a.goalsAgainst);

  const seasonRowList = [...bySeason]
    .filter(([seasonId, balance]) => {
      const season = seasonMap.get(seasonId);
      return season && balance.played >= MIN_SEASON_MATCHES && Number(season.yearFrom) < Number(currentYearFrom);
    })
    .map(([seasonId, balance]) => ({ seasonId, ...balance, pointsPerMatch: pointsPerMatch(balance) }));
  const goalDiff = (row) => row.goalsFor - row.goalsAgainst;
  const bestSeason = best(seasonRowList, (a, b) => b.pointsPerMatch - a.pointsPerMatch || goalDiff(b) - goalDiff(a));
  const worstSeason = best(seasonRowList, (a, b) => a.pointsPerMatch - b.pointsPerMatch || goalDiff(a) - goalDiff(b));
  const mostGoalsSeason = best(seasonRowList, (a, b) => b.goalsFor - a.goalsFor);

  const isWin = (g) => g.result === RESULT.WIN;
  const isLoss = (g) => g.result === RESULT.LOSS;
  const streaks = {
    unbeaten: longestRun(gameList, (g) => !isLoss(g)),
    wins: longestRun(gameList, isWin),
    scoring: longestRun(gameList, (g) => g.goalsFor > 0),
    cleanSheets: longestRun(gameList, (g) => g.goalsAgainst === 0),
  };
  const current = {
    wins: currentRun(gameList, isWin),
    unbeaten: currentRun(gameList, (g) => !isLoss(g)),
    losses: currentRun(gameList, isLoss),
    winless: currentRun(gameList, (g) => !isWin(g)),
    scoring: currentRun(gameList, (g) => g.goalsFor > 0),
    lastList: gameList.slice(-LAST_COUNT).map((g) => ({ result: g.result, match: matchRef(g) })),
  };

  const withHalf = gameList.filter((g) => g.halfFor !== null);
  const behind = withHalf.filter((g) => g.halfFor < g.halfAgainst);
  const ahead = withHalf.filter((g) => g.halfFor > g.halfAgainst);
  const comebackList = behind.filter(isWin);
  const bestComeback = best(comebackList, (a, b) => a.halfFor - a.halfAgainst - (b.halfFor - b.halfAgainst) || diff(b) - diff(a));
  const halfTime = {
    matches: withHalf.length,
    behind: behind.length,
    comebacks: comebackList.length,
    comebackDraws: behind.filter((g) => g.result === RESULT.DRAW).length,
    ahead: ahead.length,
    aheadWins: ahead.filter(isWin).length,
    bestComeback: bestComeback ? matchRef(bestComeback) : null,
  };

  // -- hráči --
  const ourPlayer = (playerId) => rosterPlayerIdSet.has(playerId);
  const lineupGameList = gameList.filter((g) => g.playerList.some((entry) => ourPlayer(entry.playerId)));
  const playerMap = new Map();
  for (const game of lineupGameList) {
    const seasonId = game.match.seasonId ?? null;
    // Hráč se do zápasu počítá jednou, i kdyby byl v sestavě omylem dvakrát.
    const seen = new Set();
    for (const entry of game.playerList) {
      if (!ourPlayer(entry.playerId) || seen.has(entry.playerId)) continue;
      seen.add(entry.playerId);
      if (!playerMap.has(entry.playerId)) playerMap.set(entry.playerId, emptyPlayer(entry.playerId));
      const player = playerMap.get(entry.playerId);
      const goals = entry.goals ?? 0;
      player.appearances++;
      player.goals += goals;
      if (entry.yellowCard) player.yellowCards++;
      if (entry.redCard) player.redCards++;
      if (isWin(game)) player.wins++;
      if (isOurGoalkeeper(entry, ourPlayer)) {
        player.goalkeeperStarts++;
        if (game.goalsAgainst === 0) player.cleanSheets++;
      }
      player.goalsBySeason.set(seasonId, (player.goalsBySeason.get(seasonId) ?? 0) + goals);
    }
  }
  const playerList = [...playerMap.values()];

  // Iron man: nejvíc zápasů v řadě (ze zápasů se sestavou) v sestavě, i jako náhradník.
  let ironMan = null;
  for (const player of playerList) {
    const run = longestRun(lineupGameList, (g) => g.playerList.some((entry) => entry.playerId === player.playerId));
    if (run && (!ironMan || run.length > ironMan.length)) ironMan = { playerId: player.playerId, ...run };
  }

  // Nejdelší série čistých kont jednoho brankáře: jeho starty v bráně jdoucí po sobě v zápasech
  // týmu; série končí inkasovaným gólem i zápasem, kdy chytal jiný.
  let cleanSheetStreak = null;
  {
    let run = null;
    for (const game of lineupGameList) {
      const goalkeeper = game.playerList.find((entry) => isOurGoalkeeper(entry, ourPlayer));
      if (!goalkeeper || game.goalsAgainst !== 0) {
        run = null;
        continue;
      }
      if (run && run.playerId === goalkeeper.playerId) {
        run.length++;
        run.to = game.match.time;
      } else {
        run = { playerId: goalkeeper.playerId, length: 1, from: game.match.time, to: game.match.time };
      }
      if (!cleanSheetStreak || run.length > cleanSheetStreak.length) cleanSheetStreak = { ...run };
    }
  }

  // Králové střelců, nejnovější sezóna první. Při shodě jsou králové všichni.
  const seasonIdList = [...new Set(lineupGameList.map((g) => g.match.seasonId ?? null))].filter((id) => seasonMap.has(id));
  const kingList = seasonIdList
    .map((seasonId) => {
      const goals = Math.max(0, ...playerList.map((p) => p.goalsBySeason.get(seasonId) ?? 0));
      if (!goals) return null;
      return {
        seasonId,
        goals,
        current: String(seasonMap.get(seasonId).yearFrom) === String(currentYearFrom),
        playerIdList: playerList.filter((p) => p.goalsBySeason.get(seasonId) === goals).map((p) => p.playerId),
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(seasonMap.get(b.seasonId).yearFrom) - Number(seasonMap.get(a.seasonId).yearFrom));

  const pick = (list, fieldList) => list.map((p) => Object.fromEntries(["playerId", ...fieldList].map((f) => [f, p[f]])));
  // Při shodě dřív ten, kdo k tomu potřeboval méně zápasů.
  const byCount = (field) => (a, b) => b[field] - a[field] || a.appearances - b.appearances;

  return {
    // Minima, pod kterými řádky do žebříčků nejdou -- klient je píše do nápověd.
    rules: {
      minSeasonMatches: MIN_SEASON_MATCHES,
      minWinWithAppearances: MIN_WIN_WITH_APPEARANCES,
      minGoalkeeperStarts: MIN_GOALKEEPER_STARTS,
      clubAppearances: CLUB_APPEARANCES,
    },
    total,
    home,
    away,
    firstSeasonId: gameList[0].match.seasonId ?? null,
    biggestWin: biggestWin ? matchRef(biggestWin) : null,
    biggestLoss: biggestLoss ? matchRef(biggestLoss) : null,
    bestSeason,
    worstSeason,
    mostGoalsSeason,
    streaks,
    current,
    halfTime,
    lineupMatches: lineupGameList.length,
    ironMan,
    cleanSheetStreak,
    club100: pick(
      playerList.filter((p) => p.appearances >= CLUB_APPEARANCES).sort((a, b) => b.appearances - a.appearances || b.goals - a.goals),
      ["appearances", "goals"],
    ),
    topScorers: pick(
      playerList
        .filter((p) => p.goals > 0)
        .sort(byCount("goals"))
        .slice(0, TOP_SCORER_COUNT),
      ["goals", "appearances"],
    ),
    kingList,
    goalkeepers: pick(
      playerList
        .filter((p) => p.goalkeeperStarts >= MIN_GOALKEEPER_STARTS)
        .sort((a, b) => b.cleanSheets - a.cleanSheets || a.goalkeeperStarts - b.goalkeeperStarts)
        .slice(0, RANK_COUNT),
      ["goalkeeperStarts", "cleanSheets"],
    ),
    yellowCards: pick(
      playerList
        .filter((p) => p.yellowCards > 0)
        .sort(byCount("yellowCards"))
        .slice(0, RANK_COUNT),
      ["yellowCards", "appearances"],
    ),
    redCards: pick(
      playerList
        .filter((p) => p.redCards > 0)
        .sort(byCount("redCards"))
        .slice(0, RANK_COUNT),
      ["redCards", "appearances"],
    ),
    winWith: pick(
      playerList
        .filter((p) => p.appearances >= MIN_WIN_WITH_APPEARANCES)
        .sort((a, b) => b.wins / b.appearances - a.wins / a.appearances || b.appearances - a.appearances)
        .slice(0, RANK_COUNT),
      ["wins", "appearances"],
    ),
  };
}

/** Id hráčů, sezón a týmů, na které dtoOut odkazuje -- co je potřeba dotáhnout. */
function collectRefs(highlights) {
  const playerIdSet = new Set();
  const seasonIdSet = new Set();
  const teamIdSet = new Set();
  const addMatch = (match) => {
    if (!match) return;
    teamIdSet.add(match.homeTeamId);
    teamIdSet.add(match.guestTeamId);
    if (match.seasonId) seasonIdSet.add(match.seasonId);
  };

  addMatch(highlights.biggestWin);
  addMatch(highlights.biggestLoss);
  addMatch(highlights.halfTime.bestComeback);
  for (const item of highlights.current.lastList) addMatch(item.match);
  for (const row of [highlights.bestSeason, highlights.worstSeason, highlights.mostGoalsSeason]) if (row) seasonIdSet.add(row.seasonId);
  if (highlights.firstSeasonId) seasonIdSet.add(highlights.firstSeasonId);
  for (const king of highlights.kingList) {
    seasonIdSet.add(king.seasonId);
    for (const id of king.playerIdList) playerIdSet.add(id);
  }
  for (const key of ["club100", "topScorers", "goalkeepers", "yellowCards", "redCards", "winWith"]) {
    for (const row of highlights[key]) playerIdSet.add(row.playerId);
  }
  for (const item of [highlights.ironMan, highlights.cleanSheetStreak]) if (item) playerIdSet.add(item.playerId);

  return { playerIdList: [...playerIdSet], seasonIdList: [...seasonIdSet], teamIdList: [...teamIdSet] };
}

export {
  computeHighlights,
  collectRefs,
  MIN_SEASON_MATCHES,
  MIN_WIN_WITH_APPEARANCES,
  MIN_GOALKEEPER_STARTS,
  CLUB_APPEARANCES,
};
