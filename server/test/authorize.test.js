import test from "node:test";
import assert from "node:assert/strict";
import { myTeamIdList, hasRole, teamScoped, roleAuth, anyTeamEditor } from "../services/authorize.js";
import Config from "../config.js";

// Autorizace se v `auth` funkcích vyhodnocuje před use casem, takže chyba tady znamená
// otevřený zápis. `identity` má tvar, v jakém ji předává caio-server: profileList je
// plochý seznam řetězců a rozsah role je v názvu (`teamEditor:<teamId>`).

const admin = { identity: "1-1-1", profileList: [Config.ROLE.AUTHORITIES] };
const editorA = { identity: "2-2-2", profileList: [`${Config.ROLE.TEAM_EDITOR}:a`] };
const editorAB = { identity: "3-3-3", profileList: [`${Config.ROLE.TEAM_EDITOR}:a`, `${Config.ROLE.TEAM_EDITOR}:b`] };
const member = { identity: "4-4-4", profileList: [Config.ROLE.MEMBERS] };

test("myTeamIdList vytáhne rozsah z názvu profilu", () => {
  assert.deepEqual(myTeamIdList(editorAB), ["a", "b"]);
  assert.deepEqual(myTeamIdList(member), []);
  assert.deepEqual(myTeamIdList(undefined), []);
  // holé `teamEditor` bez rozsahu není správce žádného týmu
  assert.deepEqual(myTeamIdList({ profileList: [Config.ROLE.TEAM_EDITOR] }), []);
});

test("hasRole nepadá na nepřihlášeném", () => {
  assert.equal(hasRole(admin, Config.CONTENT), true);
  assert.equal(hasRole(member, Config.CONTENT), false);
  assert.equal(hasRole(undefined, Config.CONTENT), false);
});

test("roleAuth pustí jen přihlášeného s rolí", async () => {
  const auth = roleAuth(Config.CONTENT);

  assert.equal(await auth({ identity: admin }), true);
  assert.equal(await auth({ identity: member }), false);
  assert.equal(await auth({ identity: null }), false);
});

test("teamScoped pustí plošnou roli bez dohledávání týmů", async () => {
  let resolved = false;
  const auth = teamScoped(async () => { resolved = true; return ["z"]; }, Config.MATCH);

  assert.equal(await auth({ dtoIn: {}, identity: admin }), true);
  assert.equal(resolved, false, "plošná role nemá sahat do databáze");
});

test("teamScoped v režimu all chce všechny dotčené týmy", async () => {
  const auth = teamScoped(async (dtoIn) => dtoIn.teamIdList, Config.MATCH, "all");

  assert.equal(await auth({ dtoIn: { teamIdList: ["a", "b"] }, identity: editorAB }), true);
  assert.equal(await auth({ dtoIn: { teamIdList: ["a", "b"] }, identity: editorA }), false);
});

test("teamScoped v režimu any stačí jeden vlastní tým", async () => {
  // Zápas má dva týmy a editor jednoho z nich do něj smí.
  const auth = teamScoped(async (dtoIn) => [dtoIn.homeTeamId, dtoIn.guestTeamId], Config.MATCH, "any");

  assert.equal(await auth({ dtoIn: { homeTeamId: "a", guestTeamId: "x" }, identity: editorA }), true);
  assert.equal(await auth({ dtoIn: { homeTeamId: "x", guestTeamId: "y" }, identity: editorA }), false);
});

test("teamScoped neprojde bez identity ani bez cílového týmu", async () => {
  const auth = teamScoped(async () => ["a"], Config.MATCH);

  assert.equal(await auth({ dtoIn: {}, identity: null }), false);
  assert.equal(await auth({ dtoIn: {}, identity: member }), false);

  // dtoIn, ke kterému se žádný tým nedohledá, se nesmí vyhodnotit jako „všechny moje"
  const empty = teamScoped(async () => [null, undefined], Config.MATCH);
  assert.equal(await empty({ dtoIn: {}, identity: editorA }), false);
});

test("anyTeamEditor pustí správce libovolného týmu", async () => {
  const auth = anyTeamEditor(Config.CONTENT);

  assert.equal(await auth({ identity: editorA }), true);
  assert.equal(await auth({ identity: admin }), true);
  assert.equal(await auth({ identity: member }), false);
  assert.equal(await auth({ identity: null }), false);
});
