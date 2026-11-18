import test from "node:test";
import assert from "node:assert/strict";
import { pragueDate, fromPrague, departureOnMatchDay } from "../services/prague-time.js";

// Český čas bez knihovny (services/prague-time.js): odjezd zápasu a migrace starých odjezdů.

test("den v české zóně, ne v UTC", () => {
  assert.equal(pragueDate("2026-10-11T22:30:00.000Z"), "2026-10-12");
  assert.equal(pragueDate("2026-01-10T22:59:00.000Z"), "2026-01-10");
});

test("z českého času do UTC v zimě, v létě a v den přechodu", () => {
  assert.equal(fromPrague({ year: 2026, month: 1, day: 10, hour: 13, minute: 30 }).toISOString(), "2026-01-10T12:30:00.000Z");
  assert.equal(fromPrague({ year: 2026, month: 6, day: 13, hour: 15, minute: 45 }).toISOString(), "2026-06-13T13:45:00.000Z");
  // 29. 3. 2026 se v 2:00 přechází na letní čas: ráno je ještě zimní, odpoledne letní.
  assert.equal(fromPrague({ year: 2026, month: 3, day: 29, hour: 1, minute: 0 }).toISOString(), "2026-03-29T00:00:00.000Z");
  assert.equal(fromPrague({ year: 2026, month: 3, day: 29, hour: 14, minute: 0 }).toISOString(), "2026-03-29T12:00:00.000Z");
  // 25. 10. 2026 zpět na zimní.
  assert.equal(fromPrague({ year: 2026, month: 10, day: 25, hour: 14, minute: 0 }).toISOString(), "2026-10-25T13:00:00.000Z");
});

test("odjezd na den zápasu: starý tvar HH:MM:SS i ISO z jiného dne", () => {
  // Výkop 17:00 SELČ, starý odjezd „15:45:00“ = 15:45 českého času.
  assert.equal(departureOnMatchDay("15:45:00", "2026-06-13T15:00:00.000Z"), "2026-06-13T13:45:00.000Z");
  assert.equal(departureOnMatchDay("9:05", "2026-01-10T12:00:00.000Z"), "2026-01-10T08:05:00.000Z");
  // Zápas přesunutý ze soboty v létě na neděli v zimě: odjezd 15:45 zůstane 15:45 českého času.
  assert.equal(departureOnMatchDay("2026-06-13T13:45:00.000Z", "2026-11-15T13:00:00.000Z"), "2026-11-15T14:45:00.000Z");
  // Den zápasu je český: výkop 22:30 UTC je 0:30 dalšího dne, odjezd se posadí na ten den.
  assert.equal(departureOnMatchDay("2026-10-11T20:00:00.000Z", "2026-10-11T22:30:00.000Z"), "2026-10-12T20:00:00.000Z");
});

test("bez výkopu nebo s nesmyslem nic", () => {
  assert.equal(departureOnMatchDay("15:45:00", null), null);
  assert.equal(departureOnMatchDay(null, "2026-06-13T15:00:00.000Z"), null);
  assert.equal(departureOnMatchDay("odpoledne", "2026-06-13T15:00:00.000Z"), null);
});
