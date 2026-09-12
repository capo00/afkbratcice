import "./no-db.js";
import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import dao from "../match/dao.js";

// `listByFilter` je jediný list zápasů v celé appce: kolo v soutěži, program víkendu,
// vzájemné zápasy i profil hráče jsou jen jiné kombinace parametrů. Chyba v něm se
// projeví jako „chybí zápasy" na jedné konkrétní obrazovce, takže se sem vyplatí sáhnout
// jednotkově. Dotaz se nespouští -- `find()` je nahrazené a jen zaznamená argumenty.

let called;

beforeEach(() => {
  called = [];
  dao.find = (...args) => {
    called.push(args);
    return Promise.resolve([]);
  };
});

function filterOf(...args) {
  dao.listByFilter(...args);
  return called.at(-1)[0];
}

test("bez parametrů se nefiltruje nic", () => {
  assert.deepEqual(filterOf(), {});
  assert.deepEqual(filterOf({}), {});
});

test("prosté parametry jdou na rovnost", () => {
  assert.deepEqual(filterOf({ seasonId: "s1", round: "3", state: "played", playerId: "p1" }), {
    seasonId: "s1",
    round: "3",
    state: "played",
    "playerList.playerId": "p1",
  });
});

test("tým se hledá doma i venku", () => {
  assert.deepEqual(filterOf({ teamId: "t1" }).$or, [{ homeTeamId: "t1" }, { guestTeamId: "t1" }]);
});

test("dvojice týmů dá vzájemné zápasy v obou orientacích", () => {
  assert.deepEqual(filterOf({ teamId: "t1", opponentId: "t2" }).$or, [
    { homeTeamId: "t1", guestTeamId: "t2" },
    { homeTeamId: "t2", guestTeamId: "t1" },
  ]);
});

test("teamIdList platí, jen když není zadaný konkrétní tým", () => {
  assert.deepEqual(filterOf({ teamIdList: ["t1", "t2"] }).$or, [
    { homeTeamId: { $in: ["t1", "t2"] } },
    { guestTeamId: { $in: ["t1", "t2"] } },
  ]);

  // konkrétní tým je užší podmínka a nesmí být seznamem přepsaný
  assert.deepEqual(filterOf({ teamId: "t1", teamIdList: ["t2"] }).$or, [{ homeTeamId: "t1" }, { guestTeamId: "t1" }]);
  // prázdný seznam se ignoruje, ne že by nevrátil nic
  assert.equal(filterOf({ teamIdList: [] }).$or, undefined);
});

test("rozsah data se skládá do jednoho `time`", () => {
  assert.deepEqual(filterOf({ dateFrom: "2026-09-01", dateTo: "2026-09-30" }).time, {
    $gte: "2026-09-01",
    $lte: "2026-09-30",
  });
  assert.deepEqual(filterOf({ dateFrom: "2026-09-01" }).time, { $gte: "2026-09-01" });
});

test("řadí se podle času a `_id`, obojí stejným směrem", () => {
  // Celé kolo se hraje v sobotu v 15:00; bez `_id` by pořadí shodných časů nebylo dané
  // a stránkování by řádky opakovalo i ztrácelo.
  dao.listByFilter({}, { pageSize: 10 });
  assert.deepEqual(called.at(-1)[2], { time: 1, _id: 1 });

  dao.listByFilter({}, { pageSize: 10 }, "desc");
  assert.deepEqual(called.at(-1)[2], { time: -1, _id: -1 });

  // cokoli jiného než "desc" je vzestupně
  dao.listByFilter({}, undefined, "nesmysl");
  assert.deepEqual(called.at(-1)[2], { time: 1, _id: 1 });
});

test("pageInfo se předává beze změny", () => {
  const pageInfo = { pageIndex: 2, pageSize: 25 };
  dao.listByFilter({}, pageInfo);

  assert.equal(called.at(-1)[1], pageInfo);
});
