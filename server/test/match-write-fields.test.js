import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import api from "../match/api.js";
import crud from "../match/crud.js";
import dao from "../match/dao.js";
import seasonDao from "../season/dao.js";
import teamDao from "../team/dao.js";

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
