import test from "node:test";
import assert from "node:assert/strict";
import api from "../match/api.js";

// `match/list` needs at least one filter that narrows the matches (review 2026-11-12, S12):
// without one it returned the whole history, 1000 matches and 677 kB per call. Like "round
// requires seasonId", it is a dtoIn rule, so the validator refuses it (invalidDtoIn).

const ID = "000000000000000000000001";

const validate = (dtoIn) => api["match/list"].validator({ dtoIn });

function refused(dtoIn) {
  assert.throws(() => validate(dtoIn), /at least one filter is required/);
}

test("no filter is refused", () => refused({}));

test("order, paging, state and an empty team list are not filters", () =>
  refused({ order: "desc", pageInfo: { pageSize: 5 }, state: "played", teamIdList: [] }));

test("opponentId alone is not a filter (the dao uses it only with teamId)", () => refused({ opponentId: ID }));

for (const dtoIn of [
  { seasonId: ID },
  { teamId: ID },
  { teamIdList: [ID] },
  { homeTeamId: ID },
  { guestTeamId: ID },
  { playerId: ID },
  { dateFrom: "2026-01-01" },
  { dateTo: "2026-12-31" },
]) {
  test(`${Object.keys(dtoIn)[0]} is enough`, () => {
    assert.deepEqual(validate({ ...dtoIn, order: "desc" }), { ...dtoIn, order: "desc" });
  });
}

test("round still needs seasonId", () => {
  assert.throws(() => validate({ teamId: ID, round: "2" }), /round requires seasonId/);
});
