import test from "node:test";
import assert from "node:assert/strict";
import { computeTable, countsTowardsTable } from "../services/table.js";

// Tabulka je nejcitlivější kus serveru: bodování se v0 lišilo od v1 (3/2/1/0 vs. 3/1/0)
// a pořadí má čtyři kritéria, z nichž vzájemné zápasy nejdou poznat z jednoho řádku.
// Testy proto drží obojí -- co se do tabulky počítá i jak se řadí.

const A = { id: "a", name: "AFK Bratčice" };
const B = { id: "b", name: "Bratčice B" };
const C = { id: "c", name: "Cvrčovice" };

let counter = 0;

/** Odehraný soutěžní zápas; `time` roste s pořadím, aby šla ověřit forma. */
function match(homeTeamId, guestTeamId, homeGoals, guestGoals, extra = {}) {
  counter++;
  return {
    id: `m${counter}`,
    round: String(counter),
    time: `2026-09-${String(counter).padStart(2, "0")}T15:00:00.000Z`,
    homeTeamId,
    guestTeamId,
    homeGoals,
    guestGoals,
    ...extra,
  };
}

function rowOf(table, teamId) {
  return table.find((row) => row.team.id === teamId);
}

test("countsTowardsTable bere jen odehrané soutěžní zápasy", () => {
  assert.equal(countsTowardsTable({ round: "1", homeGoals: 2, guestGoals: 1 }), true);
  // 0:0 je platný výsledek -- Number.isFinite, ne truthy
  assert.equal(countsTowardsTable({ round: "1", homeGoals: 0, guestGoals: 0 }), true);

  assert.equal(countsTowardsTable({ round: "1", homeGoals: null, guestGoals: null }), false);
  assert.equal(countsTowardsTable({ round: "1", homeGoals: 2 }), false);

  // přátelák: prázdné kolo ve všech třech podobách, ve kterých v datech je
  assert.equal(countsTowardsTable({ round: "", homeGoals: 2, guestGoals: 1 }), false);
  assert.equal(countsTowardsTable({ round: null, homeGoals: 2, guestGoals: 1 }), false);
  assert.equal(countsTowardsTable({ homeGoals: 2, guestGoals: 1 }), false);
});

test("soutěž bez rozstřelu boduje 3/1/0", () => {
  const table = computeTable([match("a", "b", 2, 1), match("b", "c", 0, 0)], [A, B, C]);

  const a = rowOf(table, "a");
  assert.deepEqual(
    { played: a.played, wins: a.wins, draws: a.draws, losses: a.losses, points: a.points },
    { played: 1, wins: 1, draws: 0, losses: 0, points: 3 },
  );

  const b = rowOf(table, "b");
  assert.deepEqual(
    { played: b.played, wins: b.wins, draws: b.draws, losses: b.losses, points: b.points },
    { played: 2, wins: 0, draws: 1, losses: 1, points: 1 },
  );

  assert.equal(rowOf(table, "c").points, 1);
});

test("branky se počítají oběma stranám a rozdíl se dopočítá", () => {
  const table = computeTable([match("a", "b", 3, 1)], [A, B]);

  const a = rowOf(table, "a");
  assert.deepEqual({ goalsFor: a.goalsFor, goalsAgainst: a.goalsAgainst, goalDifference: a.goalDifference },
    { goalsFor: 3, goalsAgainst: 1, goalDifference: 2 });

  const b = rowOf(table, "b");
  assert.deepEqual({ goalsFor: b.goalsFor, goalsAgainst: b.goalsAgainst, goalDifference: b.goalDifference },
    { goalsFor: 1, goalsAgainst: 3, goalDifference: -2 });
});

test("soutěž s rozstřelem boduje remízu 2/1 a nepočítá ji jako remízu", () => {
  const table = computeTable([match("a", "b", 1, 1, { penaltyWinnerTeamId: "b" })], [A, B], true);

  const a = rowOf(table, "a");
  const b = rowOf(table, "b");

  assert.equal(b.points, 2);
  assert.equal(a.points, 1);
  assert.deepEqual({ wins: b.wins, penaltyWins: b.penaltyWins, draws: b.draws }, { wins: 0, penaltyWins: 1, draws: 0 });
  assert.deepEqual({ losses: a.losses, penaltyLosses: a.penaltyLosses, draws: a.draws }, { losses: 0, penaltyLosses: 1, draws: 0 });
  // forma bere rozstřel jako výhru a prohru, ne jako remízu
  assert.deepEqual(b.form, ["W"]);
  assert.deepEqual(a.form, ["L"]);
});

test("rozhoduje nastavení sezóny, ne zápis u zápasu", () => {
  // Vítěz rozstřelu zapsaný v soutěži, která rozstřel nemá: remíza po bodu.
  const table = computeTable([match("a", "b", 1, 1, { penaltyWinnerTeamId: "b" })], [A, B], false);

  assert.equal(rowOf(table, "a").points, 1);
  assert.equal(rowOf(table, "b").points, 1);
  assert.equal(rowOf(table, "b").penaltyWins, 0);
  assert.deepEqual(rowOf(table, "b").form, ["D"]);
});

test("remíza bez zapsaného vítěze rozstřelu je i v soutěži s rozstřelem za bod", () => {
  const table = computeTable([match("a", "b", 2, 2)], [A, B], true);

  assert.equal(rowOf(table, "a").points, 1);
  assert.equal(rowOf(table, "a").draws, 1);
});

test("přátelák a nedohraný zápas tabulku neovlivní", () => {
  const table = computeTable(
    [
      match("a", "b", 9, 0, { round: null }),
      match("a", "b", null, null),
      match("a", "b", 1, 0),
    ],
    [A, B],
  );

  assert.equal(rowOf(table, "a").played, 1);
  assert.equal(rowOf(table, "a").goalsFor, 1);
});

test("tým, který ještě nehrál, je v tabulce s nulami", () => {
  const table = computeTable([], [A, B]);

  assert.equal(table.length, 2);
  assert.equal(table[0].played, 0);
  assert.deepEqual(table[0].form, []);
});

test("tým, který v seznamu účastníků chybí, se doplní jako „?“", () => {
  const table = computeTable([match("a", "x", 1, 0)], [A]);

  const x = rowOf(table, "x");
  assert.ok(x, "řádek pro neznámý tým musí vzniknout");
  assert.equal(x.team.name, "?");
  assert.equal(x.losses, 1);
});

test("forma je chronologická a nejvýš pět zápasů", () => {
  // Zápasy schválně mimo pořadí -- forma se řídí `time`, ne pořadím v poli.
  const matchList = [
    match("a", "b", 1, 0), // 1. W
    match("a", "b", 0, 1), // 2. L
    match("a", "b", 0, 0), // 3. D
    match("a", "b", 2, 0), // 4. W
    match("a", "b", 3, 0), // 5. W
    match("a", "b", 0, 4), // 6. L
  ].reverse();

  const table = computeTable(matchList, [A, B]);

  assert.deepEqual(rowOf(table, "a").form, ["L", "D", "W", "W", "L"]);
  assert.deepEqual(rowOf(table, "b").form, ["W", "D", "L", "L", "W"]);
});

test("při shodě bodů rozhodují vzájemné zápasy, až potom rozdíl branek", () => {
  // Všichni tři mají tři body. Rozdíl branek by dal pořadí B, A, C -- vzájemný zápas
  // (A porazilo B) ale A staví před B.
  const table = computeTable(
    [
      match("a", "b", 1, 0),
      match("b", "c", 5, 0),
      match("c", "a", 2, 1),
    ],
    [A, B, C],
  );

  assert.deepEqual(table.map((row) => row.team.id), ["a", "b", "c"]);
  assert.deepEqual(table.map((row) => row.points), [3, 3, 3]);
  assert.equal(rowOf(table, "b").goalDifference > rowOf(table, "a").goalDifference, true);
});

test("po vzájemných zápasech rozhoduje rozdíl branek a pak vstřelené", () => {
  const D = { id: "d", name: "Dolní Kounice" };
  const table = computeTable(
    [
      match("a", "c", 4, 0), // A: +4
      match("b", "c", 3, 0), // B: +3
      match("d", "c", 3, 1), // D: +2, ale vstřelil stejně jako B
    ],
    [A, B, C, D],
  );

  assert.deepEqual(table.map((row) => row.team.id), ["a", "b", "d", "c"]);
});

test("úplná shoda se řadí podle jména česky", () => {
  const cz = { id: "cz", name: "Čejč" };
  const dk = { id: "dk", name: "Dolní Kounice" };

  // Č patří v české abecedě před D; binární porovnání by je otočilo (U+010C > D).
  const table = computeTable([], [dk, cz]);

  assert.deepEqual(table.map((row) => row.team.name), ["Čejč", "Dolní Kounice"]);
});

test("řádky mají pořadí od jedné", () => {
  const table = computeTable([match("a", "b", 1, 0)], [A, B, C]);

  assert.deepEqual(table.map((row) => row.rank), [1, 2, 3]);
});
