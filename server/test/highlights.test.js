import test from "node:test";
import assert from "node:assert/strict";
import { computeHighlights, collectRefs } from "../services/highlights.js";
import {
  getHighlights,
  setHighlights,
  invalidateHighlights,
  highlightsGeneration,
  TTL_MS,
} from "../services/highlights-cache.js";

// Zajímavosti (services/highlights.js): výpočet nad zápasy bez databáze, a cache po kategoriích.

const US = "t-us";
const S1 = "s-2024";
const S2 = "s-2025";
const S3 = "s-2026";
const seasonMap = new Map([
  [S1, { id: S1, yearFrom: "2024" }],
  [S2, { id: S2, yearFrom: "2025" }],
  [S3, { id: S3, yearFrom: "2026" }],
]);

let seq = 0;
/** Zápas z našeho pohledu: `gf:ga`, doma/venku, poločas a naše sestava. */
function game(gf, ga, { home = true, half = null, seasonId = S1, lineup = [], round = "1", opp = "t-opp" } = {}) {
  seq++;
  const time = new Date(Date.UTC(2024, 7, 1) + seq * 7 * 864e5).toISOString();
  return {
    id: `m${String(seq).padStart(3, "0")}`,
    time,
    seasonId,
    round,
    homeTeamId: home ? US : opp,
    guestTeamId: home ? opp : US,
    homeGoals: home ? gf : ga,
    guestGoals: home ? ga : gf,
    homeGoalsHalf: half ? (home ? half[0] : half[1]) : null,
    guestGoalsHalf: half ? (home ? half[1] : half[0]) : null,
    playerList: lineup,
  };
}

const compute = (matchList, rosterIds = ["p1", "p2", "gk1", "gk2"], currentYearFrom = "2026") =>
  computeHighlights({ matchList, teamId: US, rosterPlayerIdSet: new Set(rosterIds), seasonMap, currentYearFrom });

test("bez odehraného soutěžního zápasu není co ukázat", () => {
  assert.equal(compute([]), null);
  assert.equal(compute([game(2, 0, { round: null })]), null, "přátelák se nepočítá");
  assert.equal(compute([{ ...game(0, 0), homeGoals: null, guestGoals: null }]), null, "neodehraný se nepočítá");
});

test("bilance, doma a venku; rozstřel je remíza podle gólů", () => {
  const h = compute([game(3, 1), game(1, 1), game(0, 2, { home: false }), game(4, 0, { home: false })]);
  assert.deepEqual(h.total, { played: 4, wins: 2, draws: 1, losses: 1, goalsFor: 8, goalsAgainst: 4 });
  assert.deepEqual(h.home, { played: 2, wins: 1, draws: 1, losses: 0, goalsFor: 4, goalsAgainst: 2 });
  assert.deepEqual(h.away, { played: 2, wins: 1, draws: 0, losses: 1, goalsFor: 4, goalsAgainst: 2 });
});

test("zápasy cizích týmů se ignorují", () => {
  const foreign = { ...game(1, 0), homeTeamId: "x", guestTeamId: "y" };
  assert.equal(compute([game(1, 0), foreign]).total.played, 1);
});

test("nejvyšší výhra a prohra podle rozdílu, při shodě víc gólů", () => {
  const big = game(5, 1);
  const bigger = game(6, 2, { home: false });
  const loss = game(0, 4);
  const h = compute([game(1, 0), big, bigger, loss, game(1, 2)]);
  assert.equal(h.biggestWin.id, bigger.id);
  assert.equal(h.biggestLoss.id, loss.id);
  assert.equal(h.biggestWin.homeTeamId, "t-opp");
  assert.equal("playerList" in h.biggestWin, false, "zápas jde bez sestavy");
});

test("série nejdelší i aktuální, v pořadí podle výkopu", () => {
  const list = [game(1, 0), game(2, 0), game(0, 0), game(0, 1), game(1, 0), game(3, 2), game(1, 1)];
  // Pořadí na vstupu nesmí hrát roli.
  const h = compute([...list].reverse());
  assert.equal(h.streaks.wins.length, 2);
  assert.equal(h.streaks.wins.from, list[0].time);
  assert.equal(h.streaks.unbeaten.length, 3);
  assert.equal(h.streaks.cleanSheets.length, 3);
  assert.equal(h.streaks.scoring.length, 3);
  assert.equal(h.current.unbeaten, 3);
  assert.equal(h.current.wins, 0);
  assert.equal(h.current.winless, 1);
  assert.deepEqual(
    h.current.lastList.map((x) => x.result),
    ["D", "L", "W", "W", "D"],
  );
});

test("rekordy sezón jen z celých a uzavřených sezón", () => {
  const list = [
    ...Array.from({ length: 10 }, () => game(2, 0, { seasonId: S1 })), // 3,00 b/z
    ...Array.from({ length: 10 }, () => game(0, 1, { seasonId: S2 })), // 0,00
    ...Array.from({ length: 4 }, () => game(0, 5, { seasonId: S1 })), // stejná sezóna, sníží ji
    ...Array.from({ length: 12 }, () => game(9, 0, { seasonId: S3 })), // běžící ročník, mimo
  ];
  const h = compute(list);
  assert.equal(h.bestSeason.seasonId, S1);
  assert.equal(h.bestSeason.played, 14);
  assert.equal(h.bestSeason.pointsPerMatch, 2.14);
  assert.equal(h.worstSeason.seasonId, S2);
  assert.equal(h.mostGoalsSeason.seasonId, S1);
  assert.equal(h.firstSeasonId, S1);

  const short = compute(Array.from({ length: 9 }, () => game(1, 0, { seasonId: S1 })));
  assert.equal(short.bestSeason, null, "sezóna pod 10 zápasů se do rekordů nepočítá");
});

test("poločasy a obraty", () => {
  const comeback = game(3, 2, { half: [0, 2] });
  const small = game(2, 1, { half: [0, 1] });
  const h = compute([comeback, small, game(1, 1, { half: [0, 1] }), game(2, 0, { half: [1, 0] }), game(1, 1, { half: [1, 0] }), game(5, 0)]);
  assert.deepEqual(
    { ...h.halfTime, bestComeback: h.halfTime.bestComeback.id },
    { matches: 5, behind: 3, comebacks: 2, comebackDraws: 1, ahead: 2, aheadWins: 1, bestComeback: comeback.id },
  );
});

const entry = (playerId, extra = {}) => ({ playerId, substitute: false, goals: 0, ...extra });

test("hráči: jen ze soupisky, hráč v zápase jednou, góly, karty, výhry", () => {
  const list = [
    game(2, 0, { lineup: [entry("gk1", { positionDetail: "GK" }), entry("p1", { goals: 2, yellowCard: true }), entry("foe", { goals: 5 })] }),
    game(1, 3, { lineup: [entry("gk1", { positionDetail: "GK" }), entry("p1", { goals: 1, redCard: true }), entry("p1"), entry("p2", { substitute: true })] }),
    game(0, 0, { lineup: [entry("gk2", { positionDetail: "GK" }), entry("p2", { goals: 0 })] }),
  ];
  const h = compute(list);
  assert.equal(h.lineupMatches, 3);
  assert.deepEqual(h.topScorers, [{ playerId: "p1", goals: 3, appearances: 2 }]);
  assert.deepEqual(h.yellowCards, [{ playerId: "p1", yellowCards: 1, appearances: 2 }]);
  assert.deepEqual(h.redCards, [{ playerId: "p1", redCards: 1, appearances: 2 }]);
  assert.ok(!h.topScorers.some((r) => r.playerId === "foe"), "soupeř do žebříčku nepatří");
});

test("Iron man počítá i náhradníky, série čistých kont končí jiným brankářem", () => {
  const gk = (id) => entry(id, { positionDetail: "GK" });
  const list = [
    game(1, 0, { lineup: [gk("gk1"), entry("p2", { substitute: true })] }),
    game(2, 0, { lineup: [gk("gk1"), entry("p2")] }),
    game(1, 0, { lineup: [gk("gk2"), entry("p2")] }),
    game(1, 0, { lineup: [gk("gk2"), entry("p2")] }),
    game(1, 0, { lineup: [gk("gk2")] }),
    game(0, 1, { lineup: [gk("gk1"), entry("p2")] }),
  ];
  const h = compute(list);
  assert.deepEqual({ playerId: h.ironMan.playerId, length: h.ironMan.length }, { playerId: "p2", length: 4 });
  assert.deepEqual(
    { playerId: h.cleanSheetStreak.playerId, length: h.cleanSheetStreak.length, from: h.cleanSheetStreak.from },
    { playerId: "gk2", length: 3, from: list[2].time },
  );
});

test("králové střelců po sezónách, při shodě všichni, běžící ročník označený", () => {
  const list = [
    game(2, 0, { seasonId: S1, lineup: [entry("p1", { goals: 2 }), entry("p2")] }),
    game(2, 0, { seasonId: S2, lineup: [entry("p1", { goals: 1 }), entry("p2", { goals: 1 })] }),
    game(1, 0, { seasonId: S3, lineup: [entry("p2", { goals: 1 })] }),
  ];
  const h = compute(list);
  assert.deepEqual(
    h.kingList.map((k) => [k.seasonId, k.playerIdList.sort().join(","), k.goals, k.current]),
    [
      [S3, "p2", 1, true],
      [S2, "p1,p2", 1, false],
      [S1, "p1", 2, false],
    ],
  );
});

test("S ním vyhráváme a brankáři mají minimum zápasů", () => {
  const list = [];
  for (let i = 0; i < 30; i++) list.push(game(i % 3 ? 1 : 0, 0, { lineup: [entry("gk1", { positionDetail: "GK" }), entry("p1")] }));
  for (let i = 0; i < 29; i++) list.push(game(1, 0, { lineup: [entry("p2")] }));
  const h = compute(list);
  assert.deepEqual(
    h.winWith.map((r) => r.playerId).sort(),
    ["gk1", "p1"],
    "p2 má jen 29 zápasů",
  );
  assert.deepEqual(h.winWith[0], { playerId: "gk1", wins: 20, appearances: 30 });
  assert.deepEqual(h.goalkeepers, [{ playerId: "gk1", goalkeeperStarts: 30, cleanSheets: 30 }]);
});

test("collectRefs vrátí hráče, sezóny a týmy, na které výsledek odkazuje", () => {
  const h = compute([game(2, 0, { lineup: [entry("p1", { goals: 2 })], opp: "t-x" }), game(0, 1, { opp: "t-y", seasonId: S2 })]);
  const refs = collectRefs(h);
  assert.deepEqual(refs.playerIdList.sort(), ["p1"]);
  assert.deepEqual(refs.teamIdList.sort(), ["t-us", "t-x", "t-y"]);
  assert.ok(refs.seasonIdList.includes(S1));
});

test("cache: platí do limitu, zápis zápasu ji zahodí celou", () => {
  invalidateHighlights();
  const now = 1_000_000;
  setHighlights("men-a", { a: 1 }, highlightsGeneration(), now);
  setHighlights("u19", { b: 1 }, highlightsGeneration(), now);
  assert.deepEqual(getHighlights("men-a", now + 1), { a: 1 });
  assert.equal(getHighlights("men-a", now + TTL_MS), undefined, "po limitu se počítá znovu");

  invalidateHighlights();
  assert.equal(getHighlights("u19", now + 1), undefined);
});

test("cache: výpočet, který doběhl až po zápisu, se neuloží", () => {
  const before = highlightsGeneration();
  invalidateHighlights(); // zápis zápasu během výpočtu
  setHighlights("men-a", { stale: true }, before);
  assert.equal(getHighlights("men-a"), undefined);
});
