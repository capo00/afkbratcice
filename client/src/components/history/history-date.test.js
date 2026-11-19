import { test } from "node:test";
import assert from "node:assert/strict";
import { formatHistoryDate, historyDateText } from "./history-date.js";
import { HISTORY_MILESTONE_LIST } from "../../content/history.js";

const NBSP = " ";

test("datum v každé přesnosti", () => {
  assert.equal(historyDateText({ year: 1932 }), "1932");
  assert.equal(historyDateText({ year: 1948, month: 9 }), "září 1948");
  assert.equal(historyDateText({ year: 2019, month: 7, day: 6 }), `6.${NBSP}7.${NBSP}2019`);
  assert.equal(historyDateText({ decade: 1950 }), "Padesátá léta");
  assert.equal(historyDateText({ text: "Dnes" }), "Dnes");
});

test("rozsah: bez mezer mezi roky, s mezerami u přesnějšího data", () => {
  assert.equal(historyDateText({ year: 2020, to: { year: 2021 } }), "2020–2021");
  assert.equal(historyDateText({ year: 1957, month: 6, to: { year: 1969, month: 8 } }), "červen 1957 – srpen 1969");
});

test("dateTime pro <time> jen u platného data", () => {
  assert.deepEqual(formatHistoryDate({ year: 2019, month: 7, day: 6 }).parts[0].dateTime, "2019-07-06");
  assert.deepEqual(formatHistoryDate({ year: 1948, month: 9 }).parts[0].dateTime, "1948-09");
  assert.equal(formatHistoryDate({ decade: 1950 }).parts[0].dateTime, undefined);
  assert.equal(formatHistoryDate({ text: "Dnes" }).parts[0].dateTime, undefined);
});

test("milníky historie: jedinečné id, známý typ, platné kotvy a datum", () => {
  const TYPES = ["club", "competition", "match", "venue", "youth", "community", "crisis"];
  const ids = HISTORY_MILESTONE_LIST.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "duplicitní id");
  for (const item of HISTORY_MILESTONE_LIST) {
    assert.ok(TYPES.includes(item.type), `${item.id}: typ ${item.type}`);
    assert.ok(item.title && item.summary, `${item.id}: titulek a shrnutí`);
    assert.ok(historyDateText(item.date), `${item.id}: datum`);
    for (const link of item.links ?? []) {
      if (link.anchor) assert.ok(ids.includes(link.anchor), `${item.id}: kotva ${link.anchor}`);
    }
  }
});
