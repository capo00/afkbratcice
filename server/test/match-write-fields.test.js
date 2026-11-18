import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import api from "../match/api.js";
import crud from "../match/crud.js";
import dao from "../match/dao.js";
import seasonDao from "../season/dao.js";
import teamDao from "../team/dao.js";
import Config from "../config.js";

// What `match/create`, `match/update` and `match/createMany` accept (review 2026-11-12, V1).
// The lineup and the result have their own use cases with their own rules (`setLineup`,
// `setResult`); the info use cases must not let anyone write them around those rules. The
// database is not touched -- the Dao methods are replaced.

const MATCH_ID = "000000000000000000000001";
const HOME = "000000000000000000000010";
const GUEST = "000000000000000000000020";
const PLAYER = "000000000000000000000030";
const SEASON_WITH = "000000000000000000000100";
const SEASON_WITHOUT = "000000000000000000000200";

const RESULT = { homeGoals: 2, guestGoals: 1, homeGoalsHalf: 1, guestGoalsHalf: 0, penaltyWinnerTeamId: HOME };
const LINEUP = { playerList: [{ playerId: PLAYER, goals: 3 }] };

function validated(useCase, dtoIn) {
  return api[useCase].validator({ dtoIn });
}

for (const useCase of ["match/create", "match/update"]) {
  test(`${useCase} drops the lineup and the result`, () => {
    const dtoIn = validated(useCase, { id: MATCH_ID, homeTeamId: HOME, guestTeamId: GUEST, round: "3", ...RESULT, ...LINEUP });

    assert.deepEqual(dtoIn, { id: MATCH_ID, homeTeamId: HOME, guestTeamId: GUEST, round: "3" });
  });

  test(`${useCase} keeps every field of the Info tab`, () => {
    const info = {
      id: MATCH_ID,
      seasonId: SEASON_WITH,
      round: "3",
      time: "2026-11-15T12:30:00.000Z",
      place: "Bratčice",
      departureTime: "2026-11-15T11:30:00.000Z",
      homeTeamId: HOME,
      guestTeamId: GUEST,
      state: "postponed",
      note: "Hřiště podmáčené",
    };
    assert.deepEqual(validated(useCase, info), info);
  });
}

test("match/createMany keeps the result of an imported match, not a lineup", () => {
  const { itemList } = validated("match/createMany", {
    itemList: [{ homeTeamId: HOME, guestTeamId: GUEST, seasonId: SEASON_WITH, ...RESULT, ...LINEUP }],
  });

  assert.deepEqual(itemList, [{ homeTeamId: HOME, guestTeamId: GUEST, seasonId: SEASON_WITH, ...RESULT }]);
});

let created;

beforeEach(() => {
  created = null;
  dao.createMany = async (dataList) => {
    created = dataList;
    return dataList;
  };
  // Teams without a category: the age rule does not apply (`_checkAgesMany`).
  teamDao.listByIdList = async () => [];
  seasonDao.listByIdList = async () => [];
  seasonDao.get = async (id) => {
    if (id === SEASON_WITH) return { id, hasPenalties: true };
    if (id === SEASON_WITHOUT) return { id, hasPenalties: false };
    return null;
  };
});

function importItem(patch) {
  return { homeTeamId: HOME, guestTeamId: GUEST, seasonId: SEASON_WITH, homeGoals: 1, guestGoals: 1, ...patch };
}

async function assertImportRejected(itemList, index) {
  await assert.rejects(crud.createMany(itemList), (e) => {
    assert.match(e.code, /match\/invalidPenaltyWinner$/);
    assert.equal(e.data?.index ?? e.paramMap?.index, index);
    return true;
  });
  assert.equal(created, null, "a rejected import must not save anything");
}

test("match/createMany saves a shootout winner on a draw in a season with shootouts", async () => {
  await crud.createMany([importItem({ penaltyWinnerTeamId: GUEST })]);

  assert.equal(created[0].penaltyWinnerTeamId, GUEST);
  assert.equal(created[0].state, "played");
});

test("match/createMany rejects a shootout winner the setResult rules reject, with the item index", async () => {
  await assertImportRejected([importItem(), importItem({ homeGoals: 2, penaltyWinnerTeamId: HOME })], 1);
  await assertImportRejected([importItem({ penaltyWinnerTeamId: "000000000000000000000099" })], 0);
  await assertImportRejected([importItem({ seasonId: SEASON_WITHOUT, penaltyWinnerTeamId: HOME })], 0);
});

test("match/createMany without a shootout winner does not load the season", async () => {
  seasonDao.get = async () => assert.fail("the season is not needed without a shootout winner");

  await crud.createMany([importItem({ homeGoals: 3 }), importItem({ homeGoals: undefined, guestGoals: undefined })]);
  assert.equal(created.length, 2);
});

test("match/createMany rejects a half-time score above the final one, with the item index", async () => {
  await assert.rejects(crud.createMany([importItem(), importItem({ homeGoals: 0, guestGoals: 2, homeGoalsHalf: 1, guestGoalsHalf: 3 })]), (e) => {
    assert.match(e.code, /match\/invalidHalfTime$/);
    assert.equal(e.paramMap.index, 1);
    return true;
  });
  assert.equal(created, null, "a rejected import must not save anything");
});

// Odjezd v den zápasu (Caio 2026-11-18, `match/crud.js` `_withDeparture`).
const IDENTITY_MANAGER = { profileList: [Config.ROLE.AUTHORITIES] };
const KICKOFF = "2026-11-15T13:00:00.000Z"; // 14:00 SEČ

test("match/create and match/createMany put the departure on the match day", async () => {
  dao.create = async (data) => data;
  const one = await crud.create({ homeTeamId: HOME, guestTeamId: GUEST, time: KICKOFF, departureTime: "2026-06-13T11:15:00.000Z" }, IDENTITY_MANAGER);
  assert.equal(one.departureTime, "2026-11-15T12:15:00.000Z", "13:15 SELČ -> 13:15 SEČ on the match day");

  await crud.createMany([importItem({ time: KICKOFF, departureTime: "2026-11-15T12:00:00.000Z" })]);
  assert.equal(created[0].departureTime, "2026-11-15T12:00:00.000Z");
});

test("a departure after the kick-off or without a kick-off is rejected", async () => {
  dao.create = async () => assert.fail("a rejected match must not be saved");
  for (const data of [
    { time: KICKOFF, departureTime: "2026-11-15T13:30:00.000Z" },
    { departureTime: "2026-11-15T12:00:00.000Z" },
  ]) {
    await assert.rejects(crud.create({ homeTeamId: HOME, guestTeamId: GUEST, ...data }, IDENTITY_MANAGER), (e) =>
      /match\/invalidDepartureTime$/.test(e.code),
    );
  }
  await assert.rejects(crud.createMany([importItem(), importItem({ time: KICKOFF, departureTime: "2026-11-15T14:00:00.000Z" })]), (e) => {
    assert.match(e.code, /match\/invalidDepartureTime$/);
    assert.equal(e.paramMap.index, 1);
    return true;
  });
});

test("match/update moves the stored departure with a moved match, legacy HH:MM:SS included", async () => {
  let saved;
  dao.get = async () => ({ id: MATCH_ID, homeTeamId: HOME, guestTeamId: GUEST, time: "2026-06-13T15:00:00.000Z", departureTime: "15:45:00" });
  dao.update = async (data) => (saved = data);

  // Ze soboty 17:00 SELČ na neděli 16:30 SEČ: odjezd zůstane 15:45 českého času, jen na novém dni.
  await crud.update({ id: MATCH_ID, time: "2026-11-15T15:30:00.000Z" }, IDENTITY_MANAGER);
  assert.equal(saved.departureTime, "2026-11-15T14:45:00.000Z");

  // Výkop posunutý před odjezd je chyba -- odjezd se musí upravit taky.
  saved = null;
  await assert.rejects(crud.update({ id: MATCH_ID, time: KICKOFF }, IDENTITY_MANAGER), (e) => /match\/invalidDepartureTime$/.test(e.code));
  assert.equal(saved, null);

  // Smazaný odjezd projde bez výkopu i bez kontroly.
  await crud.update({ id: MATCH_ID, departureTime: null }, IDENTITY_MANAGER);
  assert.equal(saved.departureTime, null);
});
