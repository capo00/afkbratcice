import "./no-db.js";
import test from "node:test";
import assert from "node:assert/strict";
import crud from "../article/crud.js";
import Config from "../config.js";

// Publikační okno a úklid sekcí. Obojí rozhoduje o tom, co uvidí veřejnost, a obojí je
// čistá funkce nad daty -- zbytek novinek (dotahování zápasu, titulní foto) potřebuje
// databázi a řeší ho smoke test.

const HOUR = 60 * 60 * 1000;
const later = new Date(Date.now() + HOUR).toISOString();
const earlier = new Date(Date.now() - HOUR).toISOString();

test("venku je jen publikovaná novinka, které došel čas", () => {
  assert.equal(crud._isPublic({ state: "published", publishTime: earlier }), true);
  // bez času vydání je publikovaná hned
  assert.equal(crud._isPublic({ state: "published" }), true);
  assert.equal(crud._isPublic({ state: "published", publishTime: null }), true);
});

test("naplánovaná, rozepsaná ani archivovaná novinka venku není", () => {
  assert.equal(crud._isPublic({ state: "published", publishTime: later }), false);
  assert.equal(crud._isPublic({ state: "draft", publishTime: earlier }), false);
  assert.equal(crud._isPublic({ state: "archived", publishTime: earlier }), false);
});

test("redakci dělá role z NEWS, ne přihlášení", () => {
  assert.equal(crud._isEditor({ profileList: [Config.ROLE.NEWS_EDITOR] }), true);
  assert.equal(crud._isEditor({ profileList: [Config.ROLE.AUTHORITIES] }), true);
  assert.equal(crud._isEditor({ profileList: [Config.ROLE.MEMBERS] }), false);
  assert.equal(crud._isEditor({ profileList: [Config.ROLE.GALLERY_EDITOR] }), false);
  assert.equal(crud._isEditor(null), false);
});

test("prázdná sekce se zahodí, obsah zůstane", () => {
  const result = crud._normalize({
    name: "Výhra",
    sectionList: [{ content: "text" }, { content: "   " }, { content: "" }, {}, { content: "další" }],
  });

  assert.deepEqual(result.sectionList, [{ content: "text" }, { content: "další" }]);
  assert.equal(result.name, "Výhra", "ostatní pole zůstávají");
});

test("chybějící sectionList se nedoplňuje", () => {
  // Úprava jen názvu nesmí článku smazat obsah tím, že by pole vzniklo prázdné.
  const data = { id: "a1", name: "Jen název" };

  assert.deepEqual(crud._normalize(data), data);
  assert.equal("sectionList" in crud._normalize(data), false);
});
