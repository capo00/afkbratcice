import test from "node:test";
import assert from "node:assert/strict";
import Config from "../config.js";
import clubApi from "../club/api.js";
import categoryApi from "../category/api.js";
import teamApi from "../team/api.js";
import seasonApi from "../season/api.js";
import matchApi from "../match/api.js";
import statsApi from "../stats/api.js";
import personApi from "../person/api.js";
import playerApi from "../player/api.js";
import rosterApi from "../roster/api.js";
import managementApi from "../management/api.js";
import articleApi from "../article/api.js";
import galleryApi from "../gallery/api.js";
import fileApi from "../file/api.js";
import appConfigApi from "../app-config/api.js";
import seoApi from "../seo/api.js";
import matchDao from "../match/dao.js";
import managementDao from "../management/dao.js";
import rosterDao from "../roster/dao.js";
import matchCrud from "../match/crud.js";
import articleCrud from "../article/crud.js";
import { PersonCrud } from "../person/crud.js";
import { canSeeHiddenNames } from "../services/hidden-names.js";
import { checkUseCases } from "caio-devkit/test";

// Who gets through which use case: every identity below against every use case of the
// app's own api (the framework's auth and binary use cases are not here). An `auth`
// function runs before the use case, so a wrong cell here is an open write. The table is
// the contract -- a change in it has to be a decision, not a side effect of a refactoring.

const TEAM_A = "65a0000000000000000000aa";
const TEAM_B = "65a0000000000000000000bb";
const TEAM_C = "65a0000000000000000000cc";
const MATCH_ID = "65b000000000000000000001";
const COACH_ID = "65c000000000000000000001";
const BOARD_ID = "65c000000000000000000002";
const PLAYER_ID = "65d000000000000000000001";
const ROSTER_ID = "65d000000000000000000002";
const MISSING_ID = "65e000000000000000000001";

const TE = Config.ROLE.TEAM_EDITOR;
const identityMap = {
  nobody: null,
  members: [Config.ROLE.MEMBERS],
  teamEditorBare: [TE],
  teamEditorEmpty: [`${TE}:`],
  editorA: [`${TE}:${TEAM_A}`],
  editorAB: [`${TE}:${TEAM_A}`, `${TE}:${TEAM_B}`],
  editorC: [`${TE}:${TEAM_C}`],
  matchEditor: [Config.ROLE.MATCH_EDITOR],
  newsEditor: [Config.ROLE.NEWS_EDITOR],
  galleryEditor: [Config.ROLE.GALLERY_EDITOR],
  contentEditor: [Config.ROLE.CONTENT_EDITOR],
  operatives: [Config.ROLE.OPERATIVES],
  authorities: [Config.ROLE.AUTHORITIES],
};

function identityOf(name) {
  const profileList = identityMap[name];
  return profileList && { identity: `id-${name}`, profileList };
}

const api = {
  ...clubApi, ...categoryApi, ...teamApi, ...seasonApi, ...matchApi, ...statsApi, ...personApi,
  ...playerApi, ...rosterApi, ...managementApi, ...articleApi, ...galleryApi, ...fileApi, ...appConfigApi, ...seoApi,
};

// The records the scoped `auth` functions look up: a match of A at home against B, a coach
// of A, a board member, a player of A (one roster row).
matchDao.get = async (id) => (id === MATCH_ID ? { id, homeTeamId: TEAM_A, guestTeamId: TEAM_B } : null);
managementDao.get = async (id) => {
  if (id === COACH_ID) return { id, teamId: TEAM_A, role: "coach" };
  if (id === BOARD_ID) return { id, teamId: null, role: "member" };
  return null;
};
rosterDao.get = async (id) => (id === ROSTER_ID ? { id, playerId: PLAYER_ID, teamId: TEAM_A } : null);
rosterDao.listByFilter = async ({ playerId } = {}) =>
  playerId === PLAYER_ID ? [{ id: ROSTER_ID, playerId: PLAYER_ID, teamId: TEAM_A }] : [];

// dtoIn per row; a row `uc#variant` runs use case `uc` with another dtoIn.
const dtoInMap = {
  "team/update": { id: TEAM_A },
  "team/update#foreign": { id: TEAM_C },
  "match/create": { homeTeamId: TEAM_A, guestTeamId: TEAM_C },
  "match/create#withoutA": { homeTeamId: TEAM_C, guestTeamId: TEAM_B },
  "match/update": { id: MATCH_ID },
  "match/update#missing": { id: MISSING_ID },
  "match/setResult": { id: MATCH_ID, homeGoals: 1, guestGoals: 0 },
  "match/setLineup": { id: MATCH_ID, playerList: [] },
  "management/create": { teamId: TEAM_A, role: "coach" },
  "management/create#board": { role: "member" },
  "management/update": { id: COACH_ID },
  "management/update#board": { id: BOARD_ID },
  "management/delete": { id: COACH_ID },
  "management/delete#board": { id: BOARD_ID },
  "player/create": { personId: PLAYER_ID },
  "player/update": { id: PLAYER_ID },
  "player/update#missing": { id: MISSING_ID },
  "roster/create": { playerId: PLAYER_ID, teamId: TEAM_A },
  "roster/create#foreign": { playerId: PLAYER_ID, teamId: TEAM_C },
  "roster/update": { id: ROSTER_ID },
  "roster/update#missing": { id: MISSING_ID },
  "roster/delete": { id: ROSTER_ID },
};

const ADMIN = ["authorities"];
const CONTENT = ["operatives", ...ADMIN];
const MATCH = ["matchEditor", ...CONTENT];
const NEWS = ["newsEditor", ...CONTENT];
const GALLERY = ["galleryEditor", ...CONTENT];

const EDITORS_OF_A = ["editorA", "editorAB"];
// `teamEditor:` (empty scope) edits no team; before caio-server `Authorization` it counted as "some team".
const ANY_TEAM_EDITOR = ["editorA", "editorAB", "editorC"];

// "public" = no `auth` at all; otherwise the identities the use case lets through.
const expected = {
  // BACKWARD-COMPAT alias for one release; the settings themselves are the stack's sys/settings/*.
  "appConfig/get": "public",
  "article/create": NEWS,
  "article/delete": NEWS,
  "article/get": "public",
  "article/list": "public",
  "article/setState": NEWS,
  "article/update": NEWS,
  "calendar/team": "public",
  "category/create": ADMIN,
  "category/delete": ADMIN,
  "category/get": "public",
  "category/list": "public",
  "category/update": ADMIN,
  "club/create": CONTENT,
  "club/delete": CONTENT,
  "club/get": "public",
  "club/list": "public",
  "club/update": CONTENT,
  "file/list": "public",
  "gallery/addPhoto": GALLERY,
  "gallery/create": GALLERY,
  "gallery/delete": GALLERY,
  "gallery/deletePhoto": GALLERY,
  "gallery/get": "public",
  "gallery/list": "public",
  "gallery/listPhotos": "public",
  "gallery/update": GALLERY,
  // "any": the editor of either team of the match
  // "all": every team of the record has to be the editor's -- the stored ones too, so an
  // editor of A cannot narrow a record of A and B down to A; the board is the club's, CONTENT only
  "management/create": [...EDITORS_OF_A, ...CONTENT],
  "management/create#board": CONTENT,
  "management/delete": [...EDITORS_OF_A, ...CONTENT],
  "management/delete#board": CONTENT,
  "management/get": "public",
  "management/list": "public",
  "management/update": [...EDITORS_OF_A, ...CONTENT],
  "management/update#board": CONTENT,
  "match/create": [...EDITORS_OF_A, "editorC", ...MATCH],
  "match/create#withoutA": ["editorAB", "editorC", ...MATCH],
  "match/createMany": MATCH,
  "match/delete": MATCH,
  "match/deleteMany": MATCH,
  "match/get": "public",
  "match/getLast": "public",
  "match/getNext": "public",
  "match/list": "public",
  "match/setLineup": [...EDITORS_OF_A, ...MATCH],
  "match/setResult": [...EDITORS_OF_A, ...MATCH],
  "match/update": [...EDITORS_OF_A, ...MATCH],
  "match/update#missing": MATCH,
  "person/create": [...ANY_TEAM_EDITOR, ...CONTENT],
  "person/delete": CONTENT,
  "person/get": [...ANY_TEAM_EDITOR, ...CONTENT],
  "person/linkIdentity": ADMIN,
  "person/list": [...ANY_TEAM_EDITOR, ...CONTENT],
  "person/update": CONTENT,
  // Karta hráče týmu nepatří -- založit ji smí kterýkoli editor týmu, jako osobu.
  "player/create": [...ANY_TEAM_EDITOR, ...CONTENT],
  "player/delete": CONTENT,
  "player/get": "public",
  "player/list": "public",
  "player/update": [...EDITORS_OF_A, ...CONTENT],
  "player/update#missing": CONTENT,
  "roster/create": [...EDITORS_OF_A, ...CONTENT],
  "roster/create#foreign": ["editorC", ...CONTENT],
  "roster/delete": [...EDITORS_OF_A, ...CONTENT],
  "roster/get": "public",
  "roster/list": "public",
  "roster/update": [...EDITORS_OF_A, ...CONTENT],
  "roster/update#missing": CONTENT,
  "rss": "public",
  "season/create": CONTENT,
  "season/delete": CONTENT,
  "season/get": "public",
  "season/getCurrent": "public",
  "season/list": "public",
  "season/listCurrent": "public",
  "season/listYears": "public",
  "season/update": CONTENT,
  "stats/getPlayerStats": "public",
  "stats/getTable": "public",
  "stats/listPlayerStats": "public",
  "team/create": CONTENT,
  "team/delete": CONTENT,
  "team/get": "public",
  "team/list": "public",
  "team/update": [...EDITORS_OF_A, ...CONTENT],
  "team/update#foreign": ["editorC", ...CONTENT],
};

async function actualRow(row) {
  const useCase = row.split("#")[0];
  const { auth } = api[useCase];
  if (auth === undefined) return "public";
  assert.equal(typeof auth, "function", `${useCase}: auth is expected to be a function`);
  const dtoIn = dtoInMap[row] ?? {};
  const allowed = [];
  for (const name of Object.keys(identityMap)) {
    if (await auth({ dtoIn: structuredClone(dtoIn), identity: identityOf(name), req: {} })) allowed.push(name);
  }
  return allowed;
}

const sorted = (value) => (Array.isArray(value) ? [...value].sort() : value);

test("access table has a row for every use case of the app api", () => {
  const covered = new Set(Object.keys(expected).map((row) => row.split("#")[0]));
  assert.deepEqual(Object.keys(api).filter((uc) => !covered.has(uc)), []);
  assert.deepEqual(Object.keys(dtoInMap).filter((row) => !(row in expected)), []);
});

// Public only on purpose (the "public" rows above), and every restricted use case has a
// dtoIn whitelist.
test("use cases are public only when the table says so", () => {
  const publicList = Object.keys(expected).filter((row) => expected[row] === "public");
  assert.deepEqual(checkUseCases(api, { publicList, requireValidator: true }), []);
});

test("access table: identities x use cases", async () => {
  for (const [row, allowed] of Object.entries(expected)) {
    assert.deepEqual(sorted(await actualRow(row)), sorted(allowed), row);
  }
});

// The same roles decide inside use cases, once the record is loaded.
const fnExpected = {
  "hidden names visible": [...ANY_TEAM_EDITOR, ...MATCH],
  // MEMBER (members + CONTENT) or any team editor -- not matchEditor
  "match departureTime visible": ["members", ...ANY_TEAM_EDITOR, ...CONTENT],
  "person private fields visible": CONTENT,
  "article editor": NEWS,
};

const fnCheck = {
  "hidden names visible": (identity) => canSeeHiddenNames(identity),
  "match departureTime visible": (identity) =>
    "departureTime" in matchCrud._forIdentity({ id: "m", departureTime: "10:00" }, identity),
  "person private fields visible": (identity) =>
    "email" in PersonCrud.forIdentity({ id: "p", identity: "someone-else", email: "x@y.cz" }, identity),
  "article editor": (identity) => articleCrud._isEditor(identity),
};

test("access table: role checks inside use cases", () => {
  for (const [row, allowed] of Object.entries(fnExpected)) {
    const actual = Object.keys(identityMap).filter((name) => fnCheck[row](identityOf(name)));
    assert.deepEqual(sorted(actual), sorted(allowed), row);
  }
});

test("a role that passes regardless of team does not look the record up", async () => {
  const original = matchDao.get;
  let lookupCount = 0;
  matchDao.get = async (id) => {
    lookupCount++;
    return original(id);
  };
  try {
    assert.equal(await api["match/update"].auth({ dtoIn: { id: MATCH_ID }, identity: identityOf("matchEditor") }), true);
    assert.equal(lookupCount, 0);
    assert.equal(await api["match/update"].auth({ dtoIn: { id: MATCH_ID }, identity: identityOf("editorA") }), true);
    assert.equal(lookupCount, 1);
  } finally {
    matchDao.get = original;
  }
});
