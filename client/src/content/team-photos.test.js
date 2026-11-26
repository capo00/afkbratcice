import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import TEAM_PHOTOS from "./team-photos.js";

const assetDir = fileURLToPath(new URL("../assets/teams/", import.meta.url));

test("every team photo file is in assets/teams", () => {
  const missingList = TEAM_PHOTOS.filter(({ file }) => !existsSync(assetDir + file)).map(({ file }) => file);
  assert.deepEqual(missingList, []);
});

// Rozměry webp z hlavičky (VP8X, VP8 i VP8L), bez knihovny.
function webpSize(buffer) {
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") return [1 + buffer.readUIntLE(24, 3), 1 + buffer.readUIntLE(27, 3)];
  if (chunk === "VP8 ") return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  if (chunk === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  throw new Error(`not a webp (${chunk})`);
}

test("every team photo is 600 px wide and its height matches the file -- <img width height>", () => {
  const wrongList = TEAM_PHOTOS.filter(({ file, height }) => {
    const [w, h] = webpSize(readFileSync(assetDir + file));
    return w !== 600 || h !== height;
  }).map(({ file }) => file);
  assert.deepEqual(wrongList, []);
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
