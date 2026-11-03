import test from "node:test";
import assert from "node:assert/strict";
import { seasonRange, membershipCondition, isActive } from "../services/membership.js";
import managementDao from "../management/dao.js";

// Členství v čase mají hráči i vedení. „Soupiska sezóny“ je překrytí členství s obdobím
// ročníku -- špatná hranice by hráče z jara přesunula do další sezóny.

test("ročník běží od srpna do konce července", () => {
  assert.deepEqual(seasonRange("2025"), { from: "2025-08-01", to: "2026-07-31" });
  assert.deepEqual(seasonRange(2014), { from: "2014-08-01", to: "2015-07-31" });
});

test("překrytí s obdobím: chybějící začátek i konec jsou otevřené", () => {
  assert.deepEqual(membershipCondition({ id: "t1" }, { range: { from: "2025-08-01", to: "2026-07-31" } }), {
    id: "t1",
    $and: [
      { $or: [{ dateFrom: null }, { dateFrom: { $lte: "2026-07-31" } }] },
      { $or: [{ dateTo: null }, { dateTo: { $gte: "2025-08-01" } }] },
    ],
  });
});

test("bez období je podmínka jen shoda polí", () => {
  assert.deepEqual(membershipCondition({ id: "t1", role: "coach" }), { id: "t1", role: "coach" });
});

test("aktivní členství", () => {
  assert.equal(isActive({ dateFrom: null, dateTo: null }, "2026-11-03"), true);
  assert.equal(isActive({ dateFrom: "2026-12-01", dateTo: null }, "2026-11-03"), false);
  assert.equal(isActive({ dateFrom: "2020-01-01", dateTo: "2026-11-02" }, "2026-11-03"), false);
  assert.equal(isActive({ dateTo: "2026-11-03" }, "2026-11-03"), true);
});

test("vedení: výbor, funkce v týmu a bez filtru", () => {
  const called = [];
  managementDao.find = (...args) => {
    called.push(args[0]);
    return Promise.resolve([]);
  };
  managementDao.listByFilter({ board: true });
  managementDao.listByFilter({ board: true, role: "chairman" });
  managementDao.listByFilter({ teamId: "t1", role: "coach" });
  managementDao.listByFilter({});
  assert.deepEqual(called[0], { "boardList.0": { $exists: true } });
  assert.deepEqual(called[1], { boardList: { $elemMatch: { role: "chairman" } } });
  assert.deepEqual(called[2], { teamList: { $elemMatch: { id: "t1", role: "coach" } } });
  assert.deepEqual(called[3], {});
});
