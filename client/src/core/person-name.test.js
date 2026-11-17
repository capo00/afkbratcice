import { test } from "node:test";
import assert from "node:assert/strict";
import { personName, personNameBySurname, personInitials } from "./person-name.js";
import { seasonYears, seasonName } from "./season-label.js";

test("person name in both orders, parts left out when missing", () => {
  assert.equal(personName({ name: "Jan", surname: "Novák" }), "Jan Novák");
  assert.equal(personNameBySurname({ name: "Jan", surname: "Novák" }), "Novák Jan");
  assert.equal(personName({ surname: "Novák" }), "Novák");
  // A child's name is not sent; the caller decides what stands in.
  assert.equal(personName({ id: "p1" }), "");
  assert.equal(personName(undefined), "");
});

test("initials of name and surname, empty without a name", () => {
  assert.equal(personInitials({ name: " Jan", surname: "Novák" }), "JN");
  assert.equal(personInitials({ surname: "Novák" }), "N");
  assert.equal(personInitials(null), "");
});

test("season as 2025/26, with the competition in front", () => {
  assert.equal(seasonYears({ yearFrom: 2025 }), "2025/26");
  assert.equal(seasonYears({ yearFrom: "1999" }), "1999/00");
  assert.equal(seasonYears({}), "—");
  assert.equal(seasonName({ competition: "III. třída", yearFrom: 2026 }), "III. třída 2026/27");
  assert.equal(seasonName({ yearFrom: 2026 }), "2026/27");
});
