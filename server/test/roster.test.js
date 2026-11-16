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
// Karty hráčů a osoby: `PLAYER` je karta osoby `PERSON`, `NEW_PERSON` kartu nemá.
const PERSON = "65e000000000000000000001";
const NEW_PERSON = "65e000000000000000000002";
const NEW_PLAYER = "65d000000000000000000002";
let cards = [];
let createdCards = [];
const resetCards = () => {
  cards = [{ id: PLAYER, personId: PERSON }];
  createdCards = [];
};
resetCards();
playerDao.get = async (id) => cards.find((c) => c.id === id) ?? null;
playerDao.listByIdList = async (idList) => cards.filter((c) => idList.includes(c.id));
playerDao.findByPersonId = async (personId) => cards.find((c) => c.personId === personId) ?? null;
playerDao.create = async (data) => {
  const card = { id: NEW_PLAYER, ...data };
  cards.push(card);
  createdCards.push(card);
  return card;
};
personDao.get = async (id) => ([PERSON, NEW_PERSON].includes(id) ? { id } : null);
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

test("`player/list` with `date` asks the roster for that single day", async () => {
  const seen = [];
  const original = rosterDao.listByFilter;
  rosterDao.listByFilter = async (filter) => {
    seen.push(filter);
    return [{ id: "a", playerId: PLAYER, teamId: TEAM, dateFrom: "2020-08-01", dateTo: "2022-06-30" }];
  };
  try {
    const out = await playerCrud.list({ teamId: TEAM, date: "2021-10-19" });
    assert.deepEqual(seen[0].range, { from: "2021-10-19", to: "2021-10-19" });
    assert.deepEqual(out.map((p) => p.id), [PLAYER]);
  } finally {
    rosterDao.listByFilter = original;
  }
});

test("`player/list` with a malformed `date` returns nothing, not the roster of all time", async () => {
  let called = false;
  const original = rosterDao.listByFilter;
  rosterDao.listByFilter = async () => {
    called = true;
    return [{ id: "a", playerId: PLAYER, teamId: TEAM }];
  };
  try {
    assert.deepEqual(await playerCrud.list({ teamId: TEAM, date: "19. 10. 2021" }), []);
    assert.equal(called, false);
  } finally {
    rosterDao.listByFilter = original;
  }
});

// S14 (review 2026-11-12): soupiska se plní osobou. Nová osoba kartu hráče nemá a ze seznamu
// karet by ji do týmu dát nešlo -- `roster/create` s `personId` kartu najde, nebo založí.

test("osoba s kartou: záznam dostane její kartu a nová karta nevznikne", async () => {
  stored = [];
  resetCards();
  const out = await crud.create({ personId: PERSON, teamId: TEAM, dateFrom: "2026-08-01" });
  assert.equal(out.playerId, PLAYER);
  assert.equal(out.personId, PERSON);
  assert.deepEqual(createdCards, []);
});

test("osoba bez karty: karta se založí jen s osobou a záznam stojí na ní", async () => {
  stored = [];
  resetCards();
  const written = [];
  const original = rosterDao.create;
  rosterDao.create = async (data) => (written.push(data), original(data));
  try {
    const out = await crud.create({ personId: NEW_PERSON, teamId: TEAM, dateFrom: "2026-08-01" });
    assert.deepEqual(createdCards, [{ id: NEW_PLAYER, personId: NEW_PERSON }]);
    assert.equal(out.playerId, NEW_PLAYER);
    assert.equal(out.personId, NEW_PERSON);
    // Do soupisky se `personId` neukládá, osoba je na kartě.
    assert.equal("personId" in written[0], false);
  } finally {
    rosterDao.create = original;
  }
});

test("neexistující osoba je `unknownPerson` a karta nevznikne", async () => {
  stored = [];
  resetCards();
  await assert.rejects(crud.create({ personId: "65e0000000000000000000ff", teamId: TEAM }), (e) =>
    /unknownPerson/.test(e.code ?? e.message),
  );
  assert.deepEqual(createdCards, []);
});

test("obrácené období se odmítne dřív, než se karta založí", async () => {
  stored = [];
  resetCards();
  await assert.rejects(
    crud.create({ personId: NEW_PERSON, teamId: TEAM, dateFrom: "2026-08-01", dateTo: "2026-01-01" }),
    (e) => /invalidPeriod/.test(e.code ?? e.message),
  );
  assert.deepEqual(createdCards, []);
});

test("souběh: kartu mezitím založil jiný zápis, použije se ta", async () => {
  stored = [];
  resetCards();
  const original = playerDao.create;
  playerDao.create = async ({ personId }) => {
    cards.push({ id: NEW_PLAYER, personId });
    throw new Error("E11000 duplicate key");
  };
  try {
    const out = await crud.create({ personId: NEW_PERSON, teamId: TEAM });
    assert.equal(out.playerId, NEW_PLAYER);
  } finally {
    playerDao.create = original;
  }
});

test("úprava s jinou osobou přepíše hráče záznamu, `personId` má přednost před `playerId`", async () => {
  stored = [{ id: "a", playerId: PLAYER, teamId: TEAM, dateFrom: "2026-08-01", dateTo: null }];
  resetCards();
  const out = await crud.update({ id: "a", playerId: PLAYER, personId: NEW_PERSON });
  assert.equal(out.playerId, NEW_PLAYER);
  assert.equal(out.personId, NEW_PERSON);
  assert.equal(out.teamId, TEAM);
});
