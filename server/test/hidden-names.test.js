import { test } from "node:test";
import assert from "node:assert/strict";
import { canSeeHiddenNames, personForIdentity, isPlayerHidden } from "../services/hidden-names.js";

const child = { id: "p1", name: "Jan", surname: "Malý", photoUri: "/x.webp", photoId: "b1", identity: "u-child" };
const anon = null;
const fan = { identity: "u-fan", profileList: [] };
const matchEditor = { identity: "u-me", profileList: ["matchEditor"] };
const teamEditor = { identity: "u-te", profileList: ["teamEditor:t-u15"] };

test("nepřihlášený ani běžný přihlášený jméno dítěte nedostane", () => {
  for (const identity of [anon, fan]) {
    const person = personForIdentity(child, identity, true);
    assert.equal(person.name, undefined);
    assert.equal(person.surname, undefined);
    assert.equal(person.photoUri, undefined);
    assert.equal(person.photoId, undefined);
    assert.equal(person.id, "p1");
  }
});

test("správa zápasů a editor kteréhokoli týmu jména vidí", () => {
  assert.equal(canSeeHiddenNames(matchEditor), true);
  assert.equal(canSeeHiddenNames(teamEditor), true);
  assert.equal(personForIdentity(child, teamEditor, true).surname, "Malý");
});

test("osoba sama sebe vidí", () => {
  assert.equal(personForIdentity(child, { identity: "u-child", profileList: [] }, true).name, "Jan");
});

test("mimo skrytý kontext se nic neodstraňuje", () => {
  assert.equal(personForIdentity(child, anon, false).name, "Jan");
});

test("hráč je skrytý jen s otevřeným členstvím ve skrytém týmu", () => {
  const hiddenTeams = new Set(["t-u15"]);
  const today = "2026-10-28";
  assert.equal(isPlayerHidden({ teamList: [{ id: "t-u15", dateTo: null }] }, hiddenTeams, today), true);
  assert.equal(isPlayerHidden({ teamList: [{ id: "t-u15", dateTo: "2027-06-30" }] }, hiddenTeams, today), true);
  // Bývalý žák, dnes muž: v detailu hráče jméno má.
  assert.equal(
    isPlayerHidden({ teamList: [{ id: "t-u15", dateTo: "2015-06-30" }, { id: "t-men", dateTo: null }] }, hiddenTeams, today),
    false,
  );
});
