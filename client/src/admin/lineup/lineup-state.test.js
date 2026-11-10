import { test } from "node:test";
import assert from "node:assert/strict";
import caioConfig from "../../../../caio.config.js";
import {
  DEFAULT_FORMATION,
  toEditorState,
  applyDraft,
  clearTarget,
  toPlayerList,
  fromPreviousMatch,
  isEmpty,
  playerCount,
  goalSum,
  lineupKey,
} from "./lineup-state.js";

// The position catalogue lives in caio.config.js; node has no `UiApp.AppConfig`, so the test reads it directly.
const POSITION_MAP = caioConfig.app.lineupPositionMap;
const OWN = new Set(["a", "b", "c", "d", "e", "s1", "s2"]);
const isOwn = (id) => OWN.has(id);

const filled = () =>
  toEditorState(
    [
      { playerId: "a", positionDetail: "GK" },
      { playerId: "b", positionDetail: "RB", goals: 1 },
      { playerId: "c", positionDetail: "CB", yellowCard: true },
      { playerId: "s1", substitute: true, positionDetail: "CM" },
      { playerId: "x", positionDetail: "ST" },
    ],
    isOwn,
    POSITION_MAP,
  );

const posOf = (state, playerId) => state.slots.find((s) => s.entry?.playerId === playerId)?.positionDetail;

test("an empty lineup starts with the default formation, goalkeeper included", () => {
  const state = toEditorState([], isOwn, POSITION_MAP);
  assert.deepEqual(state.slots.map((s) => s.positionDetail), DEFAULT_FORMATION);
  assert.ok(DEFAULT_FORMATION.includes("GK"));
  assert.equal(state.slots.length, 11);
  assert.ok(isEmpty(state));
  for (const code of DEFAULT_FORMATION) assert.ok(POSITION_MAP[code], code);
});

test("a saved lineup: own players on their positions, free default positions up to eleven, others aside", () => {
  const state = filled();
  assert.equal(state.slots.length, 11);
  assert.equal(posOf(state, "b"), "RB");
  assert.equal(state.slots.filter((s) => s.entry).length, 3);
  assert.deepEqual(state.subs.map((e) => e.playerId), ["s1"]);
  assert.deepEqual(state.foreign.map((e) => e.playerId), ["x"]);
  assert.equal(playerCount(state), 4);
});

test("an older record with only a line gets a free position of that line", () => {
  const state = toEditorState([{ playerId: "a", position: "FW" }], isOwn, POSITION_MAP);
  const code = posOf(state, "a");
  assert.equal(POSITION_MAP[code], "FW");
  assert.equal(state.slots.length, 11);
});

test("picking a player who is elsewhere swaps the two, with their own goals and cards", () => {
  // At RB (b, 1 goal) pick c, who plays CB with a yellow card.
  const state = applyDraft(filled(), { kind: "slot", positionDetail: "RB" }, { playerId: "c", positionDetail: "RB", goals: 0, yellowCard: true });
  assert.equal(posOf(state, "c"), "RB");
  assert.equal(posOf(state, "b"), "CB");
  assert.equal(state.slots.find((s) => s.positionDetail === "CB").entry.goals, 1);
  assert.equal(new Set(toPlayerList(state).map((e) => e.playerId)).size, toPlayerList(state).length, "nobody twice");
});

test("a substitute picked for an empty position leaves the bench", () => {
  const state = applyDraft(filled(), { kind: "slot", positionDetail: "LB" }, { playerId: "s1", positionDetail: "LB" });
  assert.equal(posOf(state, "s1"), "LB");
  assert.deepEqual(state.subs, []);
});

test("a substitute swapped with another substitute: both stay", () => {
  let state = applyDraft(filled(), { kind: "sub", playerId: null }, { playerId: "s2" });
  state = applyDraft(state, { kind: "sub", playerId: "s1" }, { playerId: "s2", goals: 2 });
  assert.deepEqual(state.subs.map((e) => e.playerId).sort(), ["s1", "s2"]);
  assert.equal(state.subs.find((e) => e.playerId === "s2").goals, 2);
});

test("moving a player to a position another slot holds swaps the positions", () => {
  const state = applyDraft(filled(), { kind: "slot", positionDetail: "RB" }, { playerId: "b", positionDetail: "CB", goals: 1 });
  assert.equal(posOf(state, "b"), "CB");
  assert.equal(posOf(state, "c"), "RB");
  assert.equal(new Set(state.slots.map((s) => s.positionDetail)).size, state.slots.length, "no position twice");
});

test("a new substitute; clearing a slot and removing a substitute", () => {
  let state = applyDraft(filled(), { kind: "sub", playerId: null }, { playerId: "s2", positionDetail: "" });
  assert.deepEqual(state.subs.map((e) => e.playerId), ["s1", "s2"]);
  assert.equal(state.subs[1].positionDetail, undefined, "no empty string for the server");
  state = clearTarget(state, { kind: "slot", positionDetail: "RB" });
  state = clearTarget(state, { kind: "sub", playerId: "s1" });
  assert.equal(posOf(state, "b"), undefined);
  assert.deepEqual(state.subs.map((e) => e.playerId), ["s2"]);
  assert.equal(state.slots.length, 11, "an emptied position stays on the pitch");
});

test("playerList for the server: empty slots out, foreign entries only for a match manager", () => {
  const state = filled();
  const own = toPlayerList(state);
  assert.deepEqual(own.map((e) => e.playerId).sort(), ["a", "b", "c", "s1"]);
  assert.equal(own.find((e) => e.playerId === "s1").substitute, true);
  assert.equal(own.find((e) => e.playerId === "a").substitute, false);
  assert.ok(own.every((e) => e.positionDetail !== ""));
  assert.deepEqual(toPlayerList(state, { includeForeign: true }).map((e) => e.playerId).sort(), ["a", "b", "c", "s1", "x"]);
});

test("taking over the previous match: positions and substitutes stay, goals and cards reset, others drop", () => {
  const empty = toEditorState([{ playerId: "x", positionDetail: "ST" }], isOwn, POSITION_MAP);
  const state = fromPreviousMatch(
    empty,
    [
      { playerId: "a", positionDetail: "GK", goals: 1, yellowCard: true },
      { playerId: "gone", positionDetail: "RB" },
      { playerId: "s1", substitute: true, redCard: true },
    ],
    isOwn,
    POSITION_MAP,
  );
  assert.equal(posOf(state, "a"), "GK");
  assert.equal(goalSum(state), 0);
  assert.ok(toPlayerList(state).every((e) => !e.yellowCard && !e.redCard));
  assert.deepEqual(state.subs.map((e) => e.playerId), ["s1"]);
  assert.equal(posOf(state, "gone"), undefined);
  assert.deepEqual(state.foreign.map((e) => e.playerId), ["x"]);
});

test("goal sum and change detection", () => {
  const state = filled();
  assert.equal(goalSum(state), 1);
  assert.equal(lineupKey(state), lineupKey(filled()));
  const changed = applyDraft(state, { kind: "slot", positionDetail: "GK" }, { playerId: "a", positionDetail: "GK", goals: 1 });
  assert.notEqual(lineupKey(changed), lineupKey(state));
  assert.equal(goalSum(changed), 2);
});
