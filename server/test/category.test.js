import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMatchAges, isFriendly } from "../services/category.js";

test("mistrovský zápas stejné věkové skupiny projde, i mezi A, B a C týmy", () => {
  assert.equal(checkMatchAges({ homeAge: "men", guestAge: "men", seasonAge: "men", friendly: false }), null);
});

test("mistrovský zápas mužů s dorostem neprojde", () => {
  assert.equal(checkMatchAges({ homeAge: "men", guestAge: "u19", seasonAge: "men", friendly: false }), "ageMismatch");
});

test("mistrovský zápas v sezóně jiné věkové skupiny neprojde", () => {
  assert.equal(checkMatchAges({ homeAge: "u15", guestAge: "u15", seasonAge: "men", friendly: false }), "seasonAgeMismatch");
});

test("stará garda smí hrát proti komukoli", () => {
  assert.equal(checkMatchAges({ homeAge: "old", guestAge: "women", seasonAge: "old", friendly: false }), null);
  assert.equal(checkMatchAges({ homeAge: "men", guestAge: "old", seasonAge: "men", friendly: false }), null);
});

test("přátelský zápas jde napříč věkovými skupinami", () => {
  assert.equal(checkMatchAges({ homeAge: "women", guestAge: "men", seasonAge: "old", friendly: true }), null);
});

test("přátelský zápas je ten bez kola", () => {
  assert.equal(isFriendly(null), true);
  assert.equal(isFriendly(""), true);
  assert.equal(isFriendly(undefined), true);
  assert.equal(isFriendly("3"), false);
});
