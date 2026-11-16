import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import api from "../team/api.js";
import crud from "../team/crud.js";
import Config from "../config.js";

// What `team/update` writes for whom (review 2026-11-12, S3). A team editor may rename their
// team, nothing more: `own: false` hid the whole category from the web, `category` gets round
// the age rule and `clubId` swaps the crest. `crud.update` is replaced -- no database.

const TEAM_ID = "000000000000000000000001";
const CLUB_ID = "000000000000000000000002";

const CONTENT = { identity: "u-c", profileList: [Config.ROLE.OPERATIVES] };
const EDITOR = { identity: "u-e", profileList: [`${Config.ROLE.TEAM_EDITOR}:${TEAM_ID}`] };

const DTO_IN = { id: TEAM_ID, name: "AFK Bratčice U15", shortName: "Bratčice", category: "u15-b", own: false, clubId: CLUB_ID };

let updated;

beforeEach(() => {
  updated = null;
  crud.update = async (dtoIn) => {
    updated = dtoIn;
    return dtoIn;
  };
});

function update(identity, dtoIn = DTO_IN) {
  return api["team/update"].fn({ dtoIn: api["team/update"].validator({ dtoIn }), identity });
}

test("team/update by a team editor writes only the name and the short name", async () => {
  await update(EDITOR);

  assert.deepEqual(updated, { id: TEAM_ID, name: "AFK Bratčice U15", shortName: "Bratčice" });
});

test("team/update by a team editor does not add fields that were not sent", async () => {
  await update(EDITOR, { id: TEAM_ID, own: false });

  assert.deepEqual(updated, { id: TEAM_ID });
});

test("team/update by the content editor writes every field", async () => {
  await update(CONTENT);

  assert.deepEqual(updated, DTO_IN);
});
