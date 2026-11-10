import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import crud from "../match/crud.js";
import dao from "../match/dao.js";
import playerDao from "../player/dao.js";
import rosterDao from "../roster/dao.js";
import Config from "../config.js";

// `match/setLineup` with `teamId` (the match modal, 2026-11-10): only the given team's players
// (its roster on the match day) are replaced, every other entry stays -- for a match manager
// and a team editor alike. The database is not touched; the Dao methods are replaced.

const MATCH_ID = "000000000000000000000001";
const TEAM_A = "0000000000000000000000a1";
const TEAM_B = "0000000000000000000000b1";
const OPPONENT = "0000000000000000000000c1";

const MANAGER = { identity: "u-m", profileList: [Config.ROLE.AUTHORITIES] };
const EDITOR_A = { identity: "u-a", profileList: [`${Config.ROLE.TEAM_EDITOR}:${TEAM_A}`] };
const EDITOR_AB = { identity: "u-ab", profileList: [`${Config.ROLE.TEAM_EDITOR}:${TEAM_A}`, `${Config.ROLE.TEAM_EDITOR}:${TEAM_B}`] };

// a1, a2: team A on the match day; b1: team B; ex: was in team A, left before the match;
// both: in team B on the match day and in team A some years earlier.
const ROSTER = [
  { playerId: "a1", teamId: TEAM_A, dateFrom: "2020-01-01", dateTo: null },
  { playerId: "a2", teamId: TEAM_A, dateFrom: "2020-01-01", dateTo: null },
  { playerId: "b1", teamId: TEAM_B, dateFrom: "2020-01-01", dateTo: null },
  { playerId: "ex", teamId: TEAM_A, dateFrom: "2020-01-01", dateTo: "2026-06-30" },
  { playerId: "both", teamId: TEAM_A, dateFrom: "2019-01-01", dateTo: "2021-06-30" },
  { playerId: "both", teamId: TEAM_B, dateFrom: "2021-07-01", dateTo: null },
];

let stored;
let updated;

beforeEach(() => {
  stored = {
    id: MATCH_ID,
    homeTeamId: TEAM_A,
    guestTeamId: TEAM_B,
    time: "2026-10-24T12:30:00.000Z",
    homeGoals: 1,
    guestGoals: 1,
    playerList: [
      { playerId: "a1", positionDetail: "GK" },
      { playerId: "ex", positionDetail: "ST" },
      { playerId: "b1", positionDetail: "GK" },
      { playerId: "both", positionDetail: "CB" },
    ],
  };
  updated = null;
  dao.get = async (id) => (id === MATCH_ID ? { ...stored } : null);
  dao.update = async (data) => {
    updated = data;
    return { ...stored, ...data };
  };
  playerDao.listByIdList = async (idList) => idList.map((id) => ({ id, personId: `p-${id}` }));
  rosterDao.listByPlayerIdList = async (idList) => ROSTER.filter((r) => idList.includes(r.playerId));
});

const ids = (list) => list.map((e) => e.playerId).sort();

test("a team editor of both teams replaces only the team he sends, the other team stays", async () => {
  await crud.setLineup({ id: MATCH_ID, teamId: TEAM_A, playerList: [{ playerId: "a2", positionDetail: "GK" }] }, EDITOR_AB);
  // a1 (A) replaced by a2; b1 and both (B on the match day) and ex (not on A's roster that day) stay.
  assert.deepEqual(ids(updated.playerList), ["a2", "b1", "both", "ex"]);
});

test("a player who was on the team only in another period is not touched", async () => {
  await crud.setLineup({ id: MATCH_ID, teamId: TEAM_A, playerList: [] }, EDITOR_A);
  assert.deepEqual(ids(updated.playerList), ["b1", "both", "ex"]);
});

test("a match manager with teamId keeps the other team as well", async () => {
  await crud.setLineup({ id: MATCH_ID, teamId: TEAM_B, playerList: [{ playerId: "b1", positionDetail: "CB", goals: 1 }] }, MANAGER);
  assert.deepEqual(ids(updated.playerList), ["a1", "b1", "ex"]);
  assert.equal(updated.playerList.find((e) => e.playerId === "b1").goals, 1);
  assert.equal(updated.playerList.find((e) => e.playerId === "b1").position, "DF", "the line is derived");
});

test("a player off the team's roster on the match day is rejected", async () => {
  await assert.rejects(
    crud.setLineup({ id: MATCH_ID, teamId: TEAM_A, playerList: [{ playerId: "ex" }] }, MANAGER),
    (e) => /match\/playerNotInMatch$/.test(e.code),
  );
  await assert.rejects(
    crud.setLineup({ id: MATCH_ID, teamId: TEAM_A, playerList: [{ playerId: "b1" }] }, MANAGER),
    (e) => /match\/playerNotInMatch$/.test(e.code),
  );
  assert.equal(updated, null);
});

test("a team editor may not send another team, and the team must play the match", async () => {
  await assert.rejects(
    crud.setLineup({ id: MATCH_ID, teamId: TEAM_B, playerList: [] }, EDITOR_A),
    (e) => /match\/foreignLineup$/.test(e.code),
  );
  await assert.rejects(
    crud.setLineup({ id: MATCH_ID, teamId: OPPONENT, playerList: [] }, MANAGER),
    (e) => /match\/teamNotInMatch$/.test(e.code),
  );
  assert.equal(updated, null);
});
