import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import crud from "../match/crud.js";
import dao from "../match/dao.js";
import seasonDao from "../season/dao.js";
import Config from "../config.js";

// `match/setResult` a vítěz penaltového rozstřelu. Rozstřel se do tabulky započítá jen
// v soutěži, která se na penalty hraje (`season.hasPenalties`), takže se jinde nesmí ani
// uložit. Databáze se nevolá -- `get`/`update` obou Dao jsou nahrazené.

const MATCH_ID = "000000000000000000000001";
const HOME = "000000000000000000000010";
const GUEST = "000000000000000000000020";
const SEASON_WITH = "000000000000000000000100";
const SEASON_WITHOUT = "000000000000000000000200";

const IDENTITY = { profileList: [Config.ROLE.AUTHORITIES] };

let stored;
let updated;

beforeEach(() => {
  stored = { id: MATCH_ID, homeTeamId: HOME, guestTeamId: GUEST, seasonId: SEASON_WITH, round: "3" };
  updated = null;

  dao.get = async (id) => (id === MATCH_ID ? { ...stored } : null);
  dao.update = async (data) => {
    updated = data;
    return { ...data };
  };
  seasonDao.get = async (id) => {
    if (id === SEASON_WITH) return { id, hasPenalties: true };
    if (id === SEASON_WITHOUT) return { id, hasPenalties: false };
    return null;
  };
});

function setResult(patch) {
  return crud.setResult({ id: MATCH_ID, homeGoals: 1, guestGoals: 1, ...patch }, IDENTITY);
}

async function assertRejected(promise, message) {
  await assert.rejects(promise, (e) => {
    assert.match(e.code, /match\/invalidPenaltyWinner$/);
    return true;
  }, message);
  assert.equal(updated, null, "odmítnutý zápis se nesmí uložit");
}

test("remíza v sezóně s penaltami vítěze rozstřelu uloží", async () => {
  const result = await setResult({ penaltyWinnerTeamId: GUEST });

  assert.equal(result.penaltyWinnerTeamId, GUEST);
  assert.equal(updated.penaltyWinnerTeamId, GUEST);
  assert.equal(updated.state, "played");
});

test("sezóna bez penalt vítěze rozstřelu odmítne", async () => {
  stored.seasonId = SEASON_WITHOUT;
  await assertRejected(setResult({ penaltyWinnerTeamId: HOME }));
});

test("zápas bez sezóny (přátelák) vítěze rozstřelu odmítne", async () => {
  delete stored.seasonId;
  await assertRejected(setResult({ penaltyWinnerTeamId: HOME }));
});

test("neexistující sezóna se bere jako sezóna bez penalt", async () => {
  stored.seasonId = "000000000000000000000999";
  await assertRejected(setResult({ penaltyWinnerTeamId: HOME }));
});

test("bez vítěze rozstřelu se na sezónu nehledí", async () => {
  stored.seasonId = SEASON_WITHOUT;
  seasonDao.get = async () => assert.fail("sezóna se bez vítěze rozstřelu nemá načítat");

  const result = await setResult({ homeGoals: 2, guestGoals: 1, penaltyWinnerTeamId: null });
  assert.equal(result.penaltyWinnerTeamId, null);
  assert.equal(updated.homeGoals, 2);
});

test("vítěz rozstřelu mimo dvojici týmů a neremíza zůstávají chybou", async () => {
  await assertRejected(setResult({ penaltyWinnerTeamId: "000000000000000000000030" }));
  await assertRejected(setResult({ homeGoals: 2, guestGoals: 1, penaltyWinnerTeamId: HOME }));
});
