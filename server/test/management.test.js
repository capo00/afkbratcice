import test from "node:test";
import assert from "node:assert/strict";
import managementDao from "../management/dao.js";
import personDao from "../person/dao.js";
import crud from "../management/crud.js";

// Funkce vedení je plochý záznam osoba + tým/výbor + funkce + období. Stejná osoba nesmí
// mít stejnou funkci ve stejném týmu/výboru ve dvou překrývajících se obdobích.

const PERSON = "65f000000000000000000001";
const TEAM = "65a0000000000000000000aa";

let stored = [];
managementDao.listSameRole = async ({ personId, teamId, role }) =>
  stored.filter((m) => m.personId === personId && (m.teamId ?? null) === (teamId ?? null) && m.role === role);
managementDao.create = async (data) => ({ id: "new", ...data });
managementDao.get = async (id) => stored.find((m) => m.id === id) ?? null;
managementDao.update = async (data) => data;
personDao.listByIdList = async () => [];

const codeOf = (e) => e?.code;

test("překrývající se období téže funkce je chyba `overlap`", async () => {
  stored = [{ id: "a", personId: PERSON, teamId: TEAM, role: "coach", dateFrom: "2007-09-01", dateTo: "2013-06-30" }];
  await assert.rejects(
    crud.create({ personId: PERSON, teamId: TEAM, role: "coach", dateFrom: "2013-06-30" }),
    (e) => /overlap/.test(codeOf(e) ?? e.message),
  );
});

test("navazující období, jiná funkce i jiný tým projdou", async () => {
  stored = [{ id: "a", personId: PERSON, teamId: TEAM, role: "coach", dateFrom: "2007-09-01", dateTo: "2013-06-30" }];
  await crud.create({ personId: PERSON, teamId: TEAM, role: "coach", dateFrom: "2013-07-01" });
  await crud.create({ personId: PERSON, teamId: TEAM, role: "assistant", dateFrom: "2010-01-01" });
  await crud.create({ personId: PERSON, role: "member", dateFrom: "2010-01-01" });
});

test("úprava se nesrovnává sama se sebou a tým nemění", async () => {
  stored = [{ id: "a", personId: PERSON, teamId: TEAM, role: "coach", dateFrom: "2007-09-01", dateTo: null }];
  const out = await crud.update({ id: "a", dateTo: "2013-06-30", teamId: "65a0000000000000000000bb" });
  assert.equal(out.teamId, TEAM);
  assert.equal(out.dateTo, "2013-06-30");
});

test("funkce musí patřit k týmu, resp. výboru; kontakt na webu jen výbor", async () => {
  stored = [];
  await assert.rejects(crud.create({ personId: PERSON, teamId: TEAM, role: "chairman" }), (e) =>
    /invalidRole/.test(codeOf(e) ?? e.message),
  );
  await assert.rejects(crud.create({ personId: PERSON, role: "coach" }), (e) => /invalidRole/.test(codeOf(e) ?? e.message));
  const coach = await crud.create({ personId: PERSON, teamId: TEAM, role: "coach", showContact: true });
  assert.equal(coach.showContact, false);
  const chairman = await crud.create({ personId: PERSON, role: "chairman", showContact: true });
  assert.equal(chairman.teamId, null);
  assert.equal(chairman.showContact, true);
});
