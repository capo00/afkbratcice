import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ROUTE_SEO, getRouteSeo, pageTitle } from "./seo.js";
import { PAGE_CODE_LIST } from "../content/pages.js";

// Routy z `ROUTE_MAP` v router.jsx (bez přesměrování a `*`). Čte se text, router je JSX.
function routerRouteList() {
  const src = fs.readFileSync(new URL("../router.jsx", import.meta.url), "utf8");
  const map = src.slice(src.indexOf("const ROUTE_MAP = {"), src.indexOf("};", src.indexOf("const ROUTE_MAP = {")));
  const keys = [...map.matchAll(/^ {2}("?)([a-z/-]*)\1: (?!\{ redirect)/gm)].map((m) => m[2]);
  return [...keys, ...PAGE_CODE_LIST];
}

test("každá routa webu má titulek a popis pro vyhledávače", () => {
  const missing = routerRouteList().filter((route) => !ROUTE_SEO[route]);
  assert.deepEqual(missing, []);
});

test("popisy se vejdou do výsledků vyhledávání (nejvýš 160 znaků)", () => {
  for (const [route, { description }] of Object.entries(ROUTE_SEO)) {
    assert.ok(description && description.length <= 160, `${route}: ${description?.length}`);
  }
});

test("neznámá routa je noindex, titulek nese název klubu", () => {
  assert.equal(getRouteSeo("neexistuje").noindex, true);
  assert.equal(getRouteSeo("").noindex, false);
  assert.equal(pageTitle(null), "AFK Bratčice");
  assert.equal(pageTitle("Kontakt"), "Kontakt · AFK Bratčice");
});
