import { test } from "node:test";
import assert from "node:assert/strict";
import { formGridLayout, inputNameList } from "./form-layout.js";

const input = { Component: () => null };

test("only fields with an input get an area", () => {
  const cfg = { logo: { input: false }, name: { input }, teamCount: {}, note: { input } };
  assert.deepEqual(inputNameList(cfg), ["name", "note"]);
  assert.deepEqual(formGridLayout(cfg), { xs: "name, note", s: "name name, note note" });
});

test("adjacent pairs share a row from s up", () => {
  const cfg = { surname: { input }, name: { input }, birthdate: { input }, email: { input }, phone: { input } };
  assert.deepEqual(
    formGridLayout(cfg, [
      ["surname", "name"],
      ["email", "phone"],
    ]),
    {
      xs: "surname, name, birthdate, email, phone",
      s: "surname name, birthdate birthdate, email phone",
    },
  );
});

test("a pair is joined across a field without an input, but not across one with it", () => {
  const cfg = { home: { input }, score: { input: false }, guest: { input }, place: { input }, round: { input } };
  assert.equal(
    formGridLayout(cfg, [
      ["home", "guest"],
      ["round", "place"],
    ]).s,
    "home guest, place place, round round",
  );
});
