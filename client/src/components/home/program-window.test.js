import { test } from "node:test";
import assert from "node:assert/strict";
import { programRange, isInProgram, WINDOW_DAYS, UNPLAYED_LOOKBACK_DAYS } from "./program-window.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date(2026, 10, 9, 10, 0); // Sunday 9 Nov 2026, 10:00 local time
const midnight = new Date(2026, 10, 9);
const daysFromMidnight = (days) => new Date(midnight.getTime() + days * DAY_MS).toISOString();

test("programRange reaches back for unplayed matches and a week ahead from today's midnight", () => {
  assert.deepEqual(programRange(now), {
    dateFrom: daysFromMidnight(-UNPLAYED_LOOKBACK_DAYS),
    dateTo: daysFromMidnight(WINDOW_DAYS),
  });
});

test("isInProgram keeps every match from today's midnight on, with or without a result", () => {
  assert.equal(isInProgram({ time: daysFromMidnight(0), state: "planned" }, now), true);
  assert.equal(isInProgram({ time: daysFromMidnight(0), homeGoals: 2, guestGoals: 1, state: "played" }, now), true);
  assert.equal(isInProgram({ time: daysFromMidnight(3), state: "postponed" }, now), true);
});

test("isInProgram keeps a match from the days before only while it has no result", () => {
  const yesterday = daysFromMidnight(-1);
  assert.equal(isInProgram({ time: yesterday, state: "planned" }, now), true);
  assert.equal(isInProgram({ time: yesterday, homeGoals: null, state: "played" }, now), true);
  assert.equal(isInProgram({ time: yesterday, homeGoals: 0, guestGoals: 0, state: "played" }, now), false);
});

test("isInProgram drops a postponed or canceled match from the days before", () => {
  const yesterday = daysFromMidnight(-1);
  assert.equal(isInProgram({ time: yesterday, state: "postponed" }, now), false);
  assert.equal(isInProgram({ time: yesterday, state: "canceled" }, now), false);
});
