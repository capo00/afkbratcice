import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { listPlayerStats, hiddenNamesRule } from "../services/stats.js";
import matchDao from "../match/dao.js";
import playerDao from "../player/dao.js";
import personDao from "../person/dao.js";
import rosterDao from "../roster/dao.js";

// Children's names in `stats/listPlayerStats` (review 2026-11-12, V3). With a season or a team
// the context decides; without either the statistics span every category, so it is decided per
// player like `player/list` -- an open membership in a hidden team. The database is not touched.

const U15_TEAM = "000000000000000000000015";
const MEN_TEAM = "000000000000000000000001";

const CHILD = { id: "000000000000000000000a01", personId: "000000000000000000000b01" };
const FORMER_CHILD = { id: "000000000000000000000a02", personId: "000000000000000000000b02" };
const ADULT = { id: "000000000000000000000a03", personId: "000000000000000000000b03" };

const PERSON_LIST = [
  { id: CHILD.personId, name: "Jan", surname: "Malý", photoUri: "/child.webp", photoId: "b1" },
  { id: FORMER_CHILD.personId, name: "Petr", surname: "Starší" },
  { id: ADULT.personId, name: "Karel", surname: "Velký" },
];

const ROSTER_LIST = [
  { playerId: CHILD.id, teamId: U15_TEAM, dateFrom: "2025-08-01", dateTo: null },
  // Played for the pupils years ago, a man today: he has his name on his profile too.
  { playerId: FORMER_CHILD.id, teamId: U15_TEAM, dateFrom: "2012-08-01", dateTo: "2015-06-30" },
  { playerId: FORMER_CHILD.id, teamId: MEN_TEAM, dateFrom: "2015-07-01", dateTo: null },
  { playerId: ADULT.id, teamId: MEN_TEAM, dateFrom: "2010-08-01", dateTo: null },
];

const HIDDEN = { hiddenAgeList: ["u15"], hiddenTeamIdSet: new Set([U15_TEAM]) };

const ANON = null;
const MATCH_EDITOR = { identity: "u-me", profileList: ["matchEditor"] };
const TEAM_EDITOR = { identity: "u-te", profileList: [`teamEditor:${U15_TEAM}`] };

beforeEach(() => {
  matchDao.aggregate = async () =>
    [CHILD, FORMER_CHILD, ADULT].map((p, index) => ({
      _id: p.id,
      appearances: 10 - index,
      starts: 5,
      goals: 3 - index,
      yellowCards: 0,
      redCards: 0,
    }));
  playerDao.listByIdList = async (idList) => [CHILD, FORMER_CHILD, ADULT].filter((p) => idList.includes(p.id));
  personDao.listByIdList = async (idList) => PERSON_LIST.filter((p) => idList.includes(p.id));
  rosterDao.listByPlayerIdList = async (idList) => ROSTER_LIST.filter((r) => idList.includes(r.playerId));
});

async function surnamesBy(dtoIn, identity) {
  const hidden = hiddenNamesRule({ ...dtoIn, ...HIDDEN });
  const itemList = await listPlayerStats({ ...dtoIn, hidden, identity });
  return Object.fromEntries(itemList.map((row) => [row.playerId, row.person?.surname ?? null]));
}

test("the rule: a season or a team decides for the whole list, nothing decides per player", () => {
  assert.equal(hiddenNamesRule({ teamId: U15_TEAM, ...HIDDEN }), true);
  assert.equal(hiddenNamesRule({ seasonId: "s", season: { age: "u15" }, ...HIDDEN }), true);
  assert.equal(hiddenNamesRule({ teamId: MEN_TEAM, season: { age: "men" }, ...HIDDEN }), false);
  assert.equal(typeof hiddenNamesRule({ ...HIDDEN }), "function");
});

test("without a season and a team a child goes without a name and photo, a former child and an adult with it", async () => {
  const hidden = hiddenNamesRule({ ...HIDDEN });
  const itemList = await listPlayerStats({ hidden, identity: ANON });
  const child = itemList.find((row) => row.playerId === CHILD.id);

  assert.deepEqual(child.person, { id: CHILD.personId, name: undefined, surname: undefined });
  assert.equal(child.goals, 3, "the numbers stay, only the name goes");
  assert.deepEqual(await surnamesBy({}, ANON), { [CHILD.id]: null, [FORMER_CHILD.id]: "Starší", [ADULT.id]: "Velký" });
});

test("without a season and a team a match editor and a team editor see every name", async () => {
  for (const identity of [MATCH_EDITOR, TEAM_EDITOR]) {
    assert.equal((await surnamesBy({}, identity))[CHILD.id], "Malý");
  }
});

test("with the U15 team everybody is hidden as before", async () => {
  assert.deepEqual(await surnamesBy({ teamId: U15_TEAM }, ANON), {
    [CHILD.id]: null,
    [FORMER_CHILD.id]: null,
    [ADULT.id]: null,
  });
});

test("with the men's team the context decides as before, without loading memberships", async () => {
  rosterDao.listByPlayerIdList = async () => assert.fail("a team context does not need the memberships");
  assert.equal((await surnamesBy({ teamId: MEN_TEAM, season: { age: "men" } }, ANON))[ADULT.id], "Velký");
});
