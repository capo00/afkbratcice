import { test } from "node:test";
import assert from "node:assert/strict";
import { LINEUP_POSITION_MAP } from "./lineup-position.js";
import { LINEUP_POSITION_MAP as SERVER_MAP } from "../../../server/services/lineup-position.js";
import cs from "../lsi/cs.json" with { type: "json" };

test("číselník přesných postů je na klientu stejný jako na serveru", () => {
  assert.deepEqual(LINEUP_POSITION_MAP, SERVER_MAP);
});

test("každý post má český název v lsi", () => {
  for (const code of Object.keys(LINEUP_POSITION_MAP)) assert.ok(cs.enum.lineupPosition?.[code], code);
});
