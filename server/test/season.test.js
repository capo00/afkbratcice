import test from "node:test";
import assert from "node:assert/strict";
import { getYearFrom, formatSeason, sortByCategoryOrder } from "../services/season.js";

// Ročník se láme v srpnu, takže polovina roku patří do „předchozí" sezóny. Je to jediné
// místo, kde se to počítá, a plete se to i lidem -- proto přelom testujeme po dnech.
// `new Date(rok, měsíc, den)` schválně: getYearFrom čte místní čas, ne UTC.

test("getYearFrom láme ročník na 1. srpnu", () => {
  assert.equal(getYearFrom(new Date(2026, 6, 31)), "2025"); // 31. 7. 2026 -> 2025/26
  assert.equal(getYearFrom(new Date(2026, 7, 1)), "2026"); //  1. 8. 2026 -> 2026/27
});

test("getYearFrom drží ročník přes přelom roku", () => {
  assert.equal(getYearFrom(new Date(2025, 11, 31)), "2025"); // 31. 12. 2025
  assert.equal(getYearFrom(new Date(2026, 0, 1)), "2025"); //   1.  1. 2026 -- pořád 2025/26
  assert.equal(getYearFrom(new Date(2026, 2, 5)), "2025"); //   5.  3. 2026
});

test("getYearFrom bere i datum jako řetězec", () => {
  assert.equal(getYearFrom("2026-09-05T15:00:00.000Z"), "2026");
  assert.equal(typeof getYearFrom(), "string");
});

test("formatSeason skládá zobrazovaný tvar", () => {
  assert.equal(formatSeason("2025"), "2025/26");
  assert.equal(formatSeason(2026), "2026/27");
  assert.equal(formatSeason("1999"), "1999/00"); // dvojciferný zbytek s vedoucí nulou
  assert.equal(formatSeason("2009"), "2009/10");
});

test("formatSeason nepadá na nesmyslu", () => {
  assert.equal(formatSeason("nesmysl"), "nesmysl");
  assert.equal(formatSeason(undefined), "");
});

test("sortByCategoryOrder řadí podle konfigurace", () => {
  const order = ["men", "u18", "u14", "old"];
  const itemList = [{ age: "old" }, { age: "u14" }, { age: "men" }, { age: "u18" }];

  assert.deepEqual(sortByCategoryOrder(itemList, order).map((x) => x.age), ["men", "u18", "u14", "old"]);
});

test("kategorie mimo pořadí jdou na konec, abecedně", () => {
  const order = ["men", "u18"];
  const itemList = [{ age: "u6" }, { age: "u18" }, { age: "u12" }, { age: "men" }];

  assert.deepEqual(sortByCategoryOrder(itemList, order).map((x) => x.age), ["men", "u18", "u12", "u6"]);
});

test("sortByCategoryOrder nemění vstupní pole a snese chybějící pořadí", () => {
  const itemList = [{ age: "u18" }, { age: "men" }];
  const sorted = sortByCategoryOrder(itemList);

  assert.deepEqual(itemList.map((x) => x.age), ["u18", "men"]);
  assert.deepEqual(sorted.map((x) => x.age), ["men", "u18"]); // bez pořadí abecedně
});
