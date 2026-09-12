import "./no-db.js";
import test from "node:test";
import assert from "node:assert/strict";
import { buildMatchFilter } from "../services/stats.js";

// Statistiky se sčítají agregací v Mongu, takže jednotkově jde ověřit jen filtr -- zato
// je to ta část, kde se rozhoduje, co se do statistik vůbec počítá. Pravidlo musí být
// stejné jako u tabulky (`countsTowardsTable`): jen odehrané soutěžní zápasy.

test("filtr vždy vyloučí přátelské a neodehrané zápasy", () => {
  const filter = buildMatchFilter({});

  // `round: { $type: "string" }` je totéž pravidlo jako prázdné kolo u tabulky a zároveň
  // to, co dovolí použít částečný unikátní index nad rozlosováním.
  assert.deepEqual(filter.round, { $type: "string" });
  assert.deepEqual(filter.homeGoals, { $ne: null });
});

test("sezóna a hráč se filtrují rovností", () => {
  assert.equal(buildMatchFilter({ seasonId: "s1" }).seasonId, "s1");
  assert.equal(buildMatchFilter({ playerId: "p1" })["playerList.playerId"], "p1");
});

test("tým se hledá v obou rolích", () => {
  assert.deepEqual(buildMatchFilter({ teamId: "t1" }).$or, [{ homeTeamId: "t1" }, { guestTeamId: "t1" }]);
});

test("nezadané parametry se do filtru nedostanou", () => {
  const filter = buildMatchFilter({ seasonId: undefined, teamId: null, playerId: "" });

  assert.deepEqual(Object.keys(filter), ["round", "homeGoals"]);
});
