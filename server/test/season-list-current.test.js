import test from "node:test";
import assert from "node:assert/strict";
import seasonDao from "../season/dao.js";
import teamDao from "../team/dao.js";
import categoryDao from "../category/dao.js";
import managementDao from "../management/dao.js";
import personDao from "../person/dao.js";
import crud from "../season/crud.js";

// `season/listCurrent` nese u každého mužstva aktivní trenéry (`coachList`), aby stránka
// /muzstva měla karty hotové od prvního vykreslení (CLS 0,031, 2026-11-26). Počítá se při
// dotazu z `afk_management` -- jeden dotaz na funkce všech mužstev, jeden na osoby.

const A = "65a0000000000000000000aa";
const B = "65a0000000000000000000bb";

teamDao.listOwn = async () => [
  { id: A, name: "AFK", category: "men-a" },
  { id: B, name: "AFK", category: "u15" },
];
seasonDao.listByYearAndTeams = async () => [
  { id: "s1", yearFrom: "2026", age: "men", competition: "III. třída", teamList: [A, "x"] },
  { id: "s2", yearFrom: "2026", age: "u15", competition: "5. liga", teamList: [B, "y"] },
];
categoryDao.listByCodeList = async () => [
  { code: "men-a", name: "A (Muži)", age: "men" },
  { code: "u15", name: "U15", age: "u15" },
];

let managementQuery;
managementDao.listByFilter = async (filter) => {
  managementQuery = filter;
  return [
    { id: "m1", personId: "p1", teamId: A, role: "coach" },
    { id: "m2", personId: "p2", teamId: A, role: "coach" },
  ];
};
personDao.listByIdList = async (idList) =>
  [
    { id: "p1", name: "Jan", surname: "Novák", email: "jan@example.test", phone: "123", birthdate: "1980-01-01" },
    { id: "p2", name: "Petr", surname: "Svoboda" },
  ].filter((p) => idList.includes(p.id));

test("listCurrent dává ke každému mužstvu jeho aktivní trenéry, jedním dotazem", async () => {
  const itemList = await crud.listCurrent({ yearFrom: "2026" });
  const byTeam = Object.fromEntries(itemList.map((item) => [item.teamId, item.coachList]));

  assert.deepEqual(managementQuery, { teamIdList: [A, B], role: "coach", active: true });
  assert.deepEqual(byTeam[A], [
    { id: "m1", personId: "p1", person: { id: "p1", name: "Jan", surname: "Novák" } },
    { id: "m2", personId: "p2", person: { id: "p2", name: "Petr", surname: "Svoboda" } },
  ]);
  // Mužstvo bez trenéra má prázdný seznam, ne `undefined` (karta pak nedrží místo navíc).
  assert.deepEqual(byTeam[B], []);
});

test("listCurrent z osoby trenéra nepouští nic kromě jména", async () => {
  const [item] = await crud.listCurrent({ yearFrom: "2026" });
  assert.deepEqual(Object.keys(item.coachList[0].person).sort(), ["id", "name", "surname"]);
});
