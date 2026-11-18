import test from "node:test";
import assert from "node:assert/strict";
import { fill, plural, perMatch, formatDate, rankList, signed, pointsPerMatch } from "./format.js";

const MATCHES = { one: "${count} zápas", few: "${count} zápasy", other: "${count} zápasů" };

test("text z LSI s parametry a českým množným číslem", () => {
  assert.equal(fill("rekord ${record}, ${x}", { record: 8 }), "rekord 8, ${x}");
  assert.deepEqual(
    [1, 2, 4, 5, 0, 11, 22].map((n) => plural(MATCHES, n)),
    ["1 zápas", "2 zápasy", "4 zápasy", "5 zápasů", "0 zápasů", "11 zápasů", "22 zápasů"],
  );
});

test("podíl na zápas: od 10 % celé číslo, pod tím na desetinu", () => {
  assert.equal(perMatch(96, 122), "79 %");
  assert.equal(perMatch(1, 250), "0,4 %");
  assert.equal(perMatch(0, 0), "—");
});

test("datum v české zóně, pořadí se shodami, znaménko, body na zápas", () => {
  // 30. 6. 22:30 UTC je v Praze už 1. 7.
  assert.equal(formatDate("2024-06-30T22:30:00.000Z"), "1. 7. 2024");
  assert.deepEqual(rankList([{ g: 5 }, { g: 5 }, { g: 3 }, { g: 3 }, { g: 1 }], "g"), [1, 1, 3, 3, 5]);
  assert.equal(signed(75), "+75");
  assert.equal(signed(-3), "−3");
  assert.equal(pointsPerMatch({ played: 319, wins: 146, draws: 50 }), "1,53");
});
