import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Error as CoreError } from "caio-server";

// Every error code the server throws has a Czech text in the client's `errors` lsi
// (review 2026-11-12, S6). Without one the admin shows the server's English message for logs.
// The codes are read from the sources, so a new `_error("…")` or `CoreError.code(…)` without
// a text fails here. The client file is only read, not imported (no-client-imports.test.js).

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SERVER = path.join(ROOT, "server");

// No admin screen ever shows these.
const NO_UI = new Set([
  // Public iCal endpoint (seo/api.js), answers a URL, not a form.
  "calendar/teamIdRequired",
]);

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "test" || entry.name === "node_modules" ? [] : sourceFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

/** `entity/code` pairs thrown by the server: `CoreError.code("a", "b")` and `this._error("b")`. */
function thrownCodes() {
  const codes = new Set();
  for (const file of sourceFiles(SERVER)) {
    const src = fs.readFileSync(file, "utf8");
    for (const [, entity, code] of src.matchAll(/CoreError\.code\("(\w+)",\s*"(\w+)"\)/g)) codes.add(`${entity}/${code}`);
    // A Crud's own `_error(code, …)` builds `CoreError.code("<entity>", code)`.
    const helper = src.match(/CoreError\.code\("(\w+)",\s*code\)/);
    if (helper) for (const [, code] of src.matchAll(/this\._error\("(\w+)"/g)) codes.add(`${helper[1]}/${code}`);
  }
  return [...codes].filter((c) => !NO_UI.has(c)).sort();
}

/** The same lookup as caio-ui `matchErrorLsi`: the exact key, then a glob key. */
function hasText(lsiErrors, code) {
  if (code in lsiErrors) return true;
  return Object.keys(lsiErrors).some(
    (key) =>
      key.includes("*") &&
      new RegExp(`^${key.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*?")}$`).test(code),
  );
}

const lsiErrors = JSON.parse(fs.readFileSync(path.join(ROOT, "client/src/lsi/cs.json"), "utf8")).errors;

test("the scan finds the server's error codes", () => {
  const codes = thrownCodes();
  // A broken pattern would find nothing and pass everything below.
  for (const code of ["match/sameTeams", "person/inUse", "roster/overlap", "category/inUse"]) {
    assert.ok(codes.includes(code), `${code} not found by the scan`);
  }
});

test("every server error code has a Czech text", () => {
  const missing = thrownCodes()
    .map((code) => CoreError.code(...code.split("/")))
    .filter((code) => !hasText(lsiErrors, code));
  assert.deepEqual(missing, []);
});

test("caio-server's own errors have a text too", () => {
  for (const code of [
    "unauthorized",
    "caio-server-auth/unauthenticated",
    "afkbratcice/team/outOfScope",
    "caio-server/team/doesNotExist",
    "afkbratcice/settings/invalidDtoIn",
    "caio-server/person/createFailed",
    "caio-server/person/deleteFailed",
  ]) {
    assert.ok(hasText(lsiErrors, code), code);
  }
});
