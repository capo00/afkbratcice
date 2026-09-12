import test from "node:test";
import assert from "node:assert/strict";
import { buildCalendar } from "../services/ical.js";

// Kalendář si člověk přidá do telefonu jednou a chyba v něm se pozná až tím, že se
// nepřidá vůbec. Escapování a lámání řádků jsou přesně ta místa, kde to spadne.

const teamMap = new Map([
  ["a", { id: "a", name: "AFK Bratčice" }],
  ["b", { id: "b", name: "Sokol Silůvky" }],
]);

function build(matchList, name = "AFK Bratčice – muži") {
  return buildCalendar({ name, matchList, teamMap, host: "afkbratcice.cz" });
}

function lines(ics) {
  return ics.split("\r\n");
}

function lineStartingWith(ics, prefix) {
  return lines(ics).find((line) => line.startsWith(prefix));
}

const zapas = {
  id: "m1",
  time: "2026-09-05T15:00:00.000Z",
  homeTeamId: "a",
  guestTeamId: "b",
  round: "3",
  place: "Bratčice",
};

test("kalendář má hlavičku, patičku a CRLF", () => {
  const ics = build([zapas]);

  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal(lineStartingWith(ics, "X-WR-CALNAME:"), "X-WR-CALNAME:AFK Bratčice – muži");
});

test("zápas se přeloží na událost dlouhou 105 minut", () => {
  const ics = build([zapas]);

  assert.equal(lineStartingWith(ics, "UID:"), "UID:match-m1@afkbratcice.cz");
  assert.equal(lineStartingWith(ics, "DTSTART:"), "DTSTART:20260905T150000Z");
  assert.equal(lineStartingWith(ics, "DTEND:"), "DTEND:20260905T164500Z");
  assert.equal(lineStartingWith(ics, "SUMMARY:"), "SUMMARY:AFK Bratčice – Sokol Silůvky");
  assert.equal(lineStartingWith(ics, "LOCATION:"), "LOCATION:Bratčice");
});

test("zápas bez termínu se do kalendáře nedostane", () => {
  const ics = build([{ ...zapas, time: null }]);

  assert.equal(ics.includes("BEGIN:VEVENT"), false);
});

test("neznámý tým se vypíše jako „?“ místo pádu", () => {
  const ics = build([{ ...zapas, guestTeamId: "neznamy" }]);

  assert.equal(lineStartingWith(ics, "SUMMARY:"), "SUMMARY:AFK Bratčice – ?");
});

test("popis rozlišuje kolo a přátelák a přilepí poznámku", () => {
  const soutezni = build([{ ...zapas, note: "hraje se na hřišti soupeře" }]);
  assert.equal(lineStartingWith(soutezni, "DESCRIPTION:"), "DESCRIPTION:3. kolo · hraje se na hřišti soupeře");

  const pratelak = build([{ ...zapas, round: null }]);
  assert.equal(lineStartingWith(pratelak, "DESCRIPTION:"), "DESCRIPTION:Přátelský zápas");
});

test("místo bez zadané adresy je prázdné, ne „undefined“", () => {
  const ics = build([{ ...zapas, place: undefined }]);

  assert.equal(lineStartingWith(ics, "LOCATION:"), "LOCATION:");
});

test("čárka, středník a zpětné lomítko se escapují", () => {
  // Bez escapování by čárka rozdělila hodnotu pole a klient by si přečetl jiné místo.
  const ics = build([{ ...zapas, place: "Bratčice, hřiště; vjezd zezadu \\ bránou" }]);

  assert.equal(lineStartingWith(ics, "LOCATION:"), "LOCATION:Bratčice\\, hřiště\\; vjezd zezadu \\\\ bránou");
});

test("nový řádek v poznámce nerozbije soubor", () => {
  // Skutečný konec řádku uvnitř hodnoty ukončí vlastnost a zbytek textu se stane
  // neznámým řádkem -- část klientů kvůli tomu zahodí celý kalendář.
  const ics = build([{ ...zapas, note: "první řádek\ndruhý řádek" }]);

  assert.equal(lineStartingWith(ics, "DESCRIPTION:"), "DESCRIPTION:3. kolo · první řádek\\ndruhý řádek");
  assert.equal(lines(ics).some((line) => line === "druhý řádek"), false);
});

test("dlouhý řádek se zalomí a pokračování začíná mezerou", () => {
  const ics = build([{ ...zapas, place: "Bratčice ".repeat(30) }]);
  const all = lines(ics);
  const index = all.findIndex((line) => line.startsWith("LOCATION:"));

  assert.ok(all[index].length <= 75, "první řádek se ořízne na 75 znaků");
  assert.ok(all[index + 1].startsWith(" "), "pokračování musí začínat mezerou");
  assert.ok(all[index + 1].length <= 75);
  // poskládané zpátky to dá původní hodnotu
  const folded = all.slice(index).filter((line) => line.startsWith("LOCATION:") || line.startsWith(" "));
  assert.equal(folded.map((line, i) => (i === 0 ? line : line.slice(1))).join("").startsWith("LOCATION:Bratčice Bratčice"), true);
});
