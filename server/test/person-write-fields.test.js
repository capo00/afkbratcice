import test from "node:test";
import assert from "node:assert/strict";
import api from "../person/api.js";

// What `person/create` and `person/update` accept (review 2026-11-12, S2). Linking a person to an
// account (`identity`) unlocks the person's contacts and a child's name for that account, so only
// `person/linkIdentity` (ADMIN) may do it -- the write use cases drop it.

const PERSON_ID = "000000000000000000000001";

const FIELDS = {
  name: "Jan",
  surname: "Novák",
  birthdate: "2012-05-01",
  email: "jan@example.test",
  phone: "+420 600 000 000",
  note: "poznámka",
};

function validated(useCase, dtoIn) {
  return api[useCase].validator({ dtoIn });
}

for (const useCase of ["person/create", "person/update"]) {
  test(`${useCase} drops identity and keeps the person's fields`, () => {
    const dtoIn = validated(useCase, { id: PERSON_ID, ...FIELDS, identity: "someone-else" });

    assert.deepEqual(dtoIn, { id: PERSON_ID, ...FIELDS });
  });
}

test("person/linkIdentity still takes identity", () => {
  assert.deepEqual(validated("person/linkIdentity", { id: PERSON_ID, identity: "u-1" }), { id: PERSON_ID, identity: "u-1" });
});
