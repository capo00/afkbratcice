import { test } from "node:test";
import assert from "node:assert/strict";
import caioConfig from "../../../caio.config.js";
import cs from "../lsi/cs.json" with { type: "json" };

// Číselníky, které zná server i klient, jsou v caio.config.js `app` (jen kódy a pořadí); popisky
// v LSI (`enum.*`). Kód bez popisku by se ve formuláři a na webu ukázal holý. Do 2026-11 hlídal
// lineup-position.test.js shodu kopie číselníku postů na klientu se serverem; kopie už není.
const { app } = caioConfig;

const ENUM_BY_LIST = {
  age: app.ageList,
  position: app.positionList,
  lineupPosition: Object.keys(app.lineupPositionMap),
  matchState: app.matchStateList,
  articleState: app.articleStateList,
  galleryState: app.galleryStateList,
  galleryCategory: app.galleryCategoryList,
  coachRole: app.coachRoleList,
  role: Object.values(app.role),
};

test("každý kód číselníku má český popisek v lsi", () => {
  for (const [enumName, codeList] of Object.entries(ENUM_BY_LIST)) {
    for (const code of codeList) assert.ok(cs.enum[enumName]?.[code], `enum.${enumName}.${code}`);
  }
});

test("každý přesný post patří do linie z positionList", () => {
  for (const [code, line] of Object.entries(app.lineupPositionMap)) assert.ok(app.positionList.includes(line), code);
});
