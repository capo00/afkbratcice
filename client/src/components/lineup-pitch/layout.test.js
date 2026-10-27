import { test } from "node:test";
import assert from "node:assert/strict";
import { POSITION_POINT, layoutLineup, shortName, initials, PLAYER_BOX } from "./layout.js";
import { LINEUP_POSITION_LIST } from "../../config/lineup-position.js";

test("každý přesný post má místo na hřišti", () => {
  assert.deepEqual(Object.keys(POSITION_POINT).sort(), [...LINEUP_POSITION_LIST].sort());
});

test("sousední posty se nepřekrývají ani při nejmenší šířce hřiště", () => {
  // Hráč zabírá kolem bodu šířku jména a výšku kruhu se jménem (PLAYER_BOX, v procentech
  // hřiště při nejmenší podporované šířce). Dva posty kolidují, když se překrývají v obou osách.
  const codes = Object.keys(POSITION_POINT);
  const clash = [];
  for (let i = 0; i < codes.length; i++) {
    for (let j = i + 1; j < codes.length; j++) {
      const a = POSITION_POINT[codes[i]];
      const b = POSITION_POINT[codes[j]];
      if (Math.abs(a.x - b.x) < PLAYER_BOX.width && Math.abs(a.y - b.y) < PLAYER_BOX.height) clash.push(`${codes[i]}-${codes[j]}`);
    }
  }
  assert.deepEqual(clash, []);
});

test("hráč se vejde na hřiště", () => {
  for (const [code, { x, y }] of Object.entries(POSITION_POINT)) {
    assert.ok(x - PLAYER_BOX.width / 2 >= 0 && x + PLAYER_BOX.width / 2 <= 100, `${code} x`);
    assert.ok(y - PLAYER_BOX.up >= 0 && y + PLAYER_BOX.down <= 100, `${code} y`);
  }
});

test("rozestavení: přesný post, linie, náhradník, bez postu", () => {
  const { placed, substitutes, unplaced } = layoutLineup([
    { playerId: "a", positionDetail: "GK" },
    { playerId: "b", position: "DF" },
    { playerId: "c", position: "DF" },
    { playerId: "d", substitute: true },
    { playerId: "e" },
  ]);
  assert.deepEqual(placed.map((p) => [p.entry.playerId, Math.round(p.x), p.y]), [["a", 50, 89], ["b", 33, 75], ["c", 67, 75]]);
  assert.deepEqual(substitutes.map((e) => e.playerId), ["d"]);
  assert.deepEqual(unplaced.map((e) => e.playerId), ["e"]);
});

test("jméno pod kruhem a iniciály", () => {
  const entry = { person: { name: "Oleksandr", surname: "Shpuryk" } };
  assert.equal(shortName(entry), "Shpuryk O.");
  assert.equal(shortName(entry, { surnameOnly: true }), "Shpuryk");
  assert.equal(initials(entry), "OS");
  assert.equal(shortName({ player: { number: 7 } }), "#7");
  assert.equal(initials({}), "?");
});
