import "./no-db.js";
import test from "node:test";
import assert from "node:assert/strict";
import { PersonCrud } from "../person/crud.js";
import Config from "../config.js";

// Ochrana osobních údajů. Filtr je schválně v crud vrstvě, ne v use casech -- osoba se
// vrací i z player/list a match/get, takže kontrola v API by šla obejít. Test proto míří
// na `forIdentity`, ne na jednotlivé use casy.

const person = {
  id: "p1",
  name: "Jan",
  surname: "Novák",
  identity: "9-9-9",
  birthdate: "1990-01-01",
  email: "jan@example.com",
  phone: "+420111222333",
  note: "interní poznámka",
};

const PRIVATE = ["birthdate", "email", "phone", "note"];

test("veřejnosti se kontakty nevrací", () => {
  const result = PersonCrud.forIdentity(person, null);

  for (const field of PRIVATE) assert.equal(field in result, false, field);
  assert.deepEqual({ name: result.name, surname: result.surname }, { name: "Jan", surname: "Novák" });
});

test("přihlášený bez role je pořád veřejnost", () => {
  const member = { identity: "1-2-3", profileList: [Config.ROLE.MEMBERS] };

  assert.equal("email" in PersonCrud.forIdentity(person, member), false);
});

test("role z CONTENT vidí celý záznam", () => {
  for (const role of Config.CONTENT) {
    const result = PersonCrud.forIdentity(person, { identity: "1-2-3", profileList: [role] });
    assert.equal(result.email, "jan@example.com", role);
  }
});

test("na vlastní záznam vidí každý", () => {
  const self = { identity: "9-9-9", profileList: [] };

  assert.equal(PersonCrud.forIdentity(person, self).phone, "+420111222333");
});

test("nespárovaná osoba není „vlastní“ pro nepřihlášeného", () => {
  // Osoba bez `identity` a volající bez identity -- obojí undefined; bez pojistky by se
  // porovnaly jako shodné a záznam by se vydal celý.
  const unlinked = { ...person, identity: undefined };

  assert.equal("email" in PersonCrud.forIdentity(unlinked, undefined), false);
  assert.equal("email" in PersonCrud.forIdentity(unlinked, { identity: undefined, profileList: [] }), false);
});

test("filtr nemění vstupní objekt", () => {
  const input = { ...person };
  PersonCrud.forIdentity(input, null);

  assert.equal(input.email, "jan@example.com");
});

test("prázdný vstup projde beze změny", () => {
  assert.equal(PersonCrud.forIdentity(null, null), null);
  assert.equal(PersonCrud.forIdentity(undefined, null), undefined);
});
