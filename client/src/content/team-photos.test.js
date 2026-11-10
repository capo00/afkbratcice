import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import TEAM_PHOTOS from "./team-photos.js";

const assetDir = fileURLToPath(new URL("../assets/teams/", import.meta.url));

test("every team photo file is in assets/teams", () => {
  const missingList = TEAM_PHOTOS.filter(({ file }) => !existsSync(assetDir + file)).map(({ file }) => file);
  assert.deepEqual(missingList, []);
});

test("every team photo has its own rows only -- no row label twice under one photo", () => {
  // The first transcription glued the rows of all photos of a season under the first one.
  const gluedList = TEAM_PHOTOS.filter(({ rowList }) => new Set(rowList.map((r) => r.label)).size !== rowList.length);
  assert.deepEqual(gluedList.map(({ file }) => file), []);
});

test("team photo files are unique", () => {
  const fileList = TEAM_PHOTOS.map(({ file }) => file);
  assert.equal(new Set(fileList).size, fileList.length);
});
