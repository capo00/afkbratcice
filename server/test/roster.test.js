import test from "node:test";
import assert from "node:assert/strict";
import rosterDao from "../roster/dao.js";
import playerDao from "../player/dao.js";
import personDao from "../person/dao.js";
import playerCrud from "../player/crud.js";
import crud from "../roster/crud.js";

// Soupiska: záznam = hráč v týmu v období. Týž hráč nesmí být v témž týmu ve dvou
// překrývajících se obdobích; jiný tým nebo navazující období projde.

const PLAYER = "65d000000000000000000001";
const TEAM = "65a0000000000000000000aa";
const OTHER_TEAM = "65a0000000000000000000bb";

let stored = [];
rosterDao.listByFilter = async ({ playerId, teamId } = {}) =>
  stored.filter((r) => (!playerId || r.playerId === playerId) && (!teamId || r.teamId === teamId));
rosterDao.listByPlayerIdList = async (idList) => stored.filter((r) => idList.includes(r.playerId));
rosterDao.create = async (data) => ({ id: "new", ...data });
rosterDao.get = async (id) => stored.find((r) => r.id === id) ?? null;
rosterDao.update = async (data) => data;
playerDao.get = async (id) => (id === PLAYER ? { id, personId: "p" } : null);
playerDao.listByIdList = async (idList) => (idList.includes(PLAYER) ? [{ id: PLAYER, personId: "p" }] : []);
personDao.listByIdList = async () => [];
// Jména dětí a osoby tu nejsou předmětem testu (a potřebovaly by databázi).
playerCrud._withPerson = async (playerList) => playerList;

test("překrývající se působení v témž týmu je chyba `overlap`", async () => {
  stored = [{ id: "a", playerId: PLAYER, teamId: TEAM, dateFrom: "2020-08-01", dateTo: "2022-06-30" }];
  await assert.rejects(crud.create({ playerId: PLAYER, teamId: TEAM, dateFrom: "2022-06-30" }), (e) =>
    /overlap/.test(e.code ?? e.message),
  );
});

test("navazující období a jiný tým projdou", async () => {
  stored = [{ id: "a", playerId: PLAYER, teamId: TEAM, dateFrom: "2020-08-01", dateTo: "2022-06-30" }];
  await crud.create({ playerId: PLAYER, teamId: TEAM, dateFrom: "2022-07-01" });
  await crud.create({ playerId: PLAYER, teamId: OTHER_TEAM, dateFrom: "2021-01-01" });
});

test("úprava se nesrovnává sama se sebou a tým nemění", async () => {
  stored = [{ id: "a", playerId: PLAYER, teamId: TEAM, dateFrom: "2020-08-01", dateTo: null }];
  const out = await crud.update({ id: "a", dateTo: "2022-06-30", teamId: OTHER_TEAM });
  assert.equal(out.teamId, TEAM);
  assert.equal(out.dateTo, "2022-06-30");
});

test("neexistující hráč a obrácené období jsou chyba", async () => {
  stored = [];
  await assert.rejects(crud.create({ playerId: "65d0000000000000000000ff", teamId: TEAM }), (e) =>
    /unknownPlayer/.test(e.code ?? e.message),
  );
  await assert.rejects(crud.create({ playerId: PLAYER, teamId: TEAM, dateFrom: "2022-01-01", dateTo: "2021-01-01" }), (e) =>
    /invalidPeriod/.test(e.code ?? e.message),
  );
});
