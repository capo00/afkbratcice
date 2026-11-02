import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_APP_SETTINGS, toStoredApp, fromStoredApp } from "../app-settings/defaults.js";
import { validatePublic, validatePrivate } from "../app-settings/index.js";

// Nastavení klubu (sys_settings.app): všechno veřejné, výchozí hodnoty a validátory,
// kterými App.init kontroluje `sys/settings/update` (a tools/migrate-settings.js data z afk_config).

// Tvar, jaký měl dokument v afk_config (migrate-2026.js, migrate-categories.js).
const LEGACY = {
  ...DEFAULT_APP_SETTINGS,
  contact: { address: "Bratčice 100, 285 06", gps: "49.853660, 15.423600", email: "info@afk.test" },
  socialList: [{ code: "facebook", uri: "https://www.facebook.com/afk.test" }],
  fileCategoryList: [{ code: "rules", name: "Řády a stanovy" }],
};

function paramKeys(fn) {
  try {
    fn();
  } catch (e) {
    assert.equal(e.status, 400);
    return Object.keys({ ...e.paramMap?.missingKeyMap, ...e.paramMap?.invalidValueKeyMap }).sort();
  }
  assert.fail("expected a 400");
}

test("všechno je veřejné včetně kategorií souborů; čtení doplní výchozí hodnoty", () => {
  const stored = toStoredApp(LEGACY);
  assert.deepEqual(stored.private, {});
  assert.deepEqual(stored.public.fileCategoryList, LEGACY.fileCategoryList);
  assert.deepEqual(fromStoredApp(stored), LEGACY);
  assert.deepEqual(fromStoredApp({ public: {}, private: {} }), DEFAULT_APP_SETTINGS);
});

test("validátory přijmou data z afk_config beze změny", () => {
  const stored = toStoredApp(LEGACY);
  assert.deepEqual(validatePublic(stored.public), stored.public);
  assert.deepEqual(validatePrivate(stored.private), stored.private);
});

test("prázdný rok založení a kontakt zůstanou na výchozí hodnotě", () => {
  const value = validatePublic({ ...toStoredApp(DEFAULT_APP_SETTINGS).public, founded: null, contact: {} });
  assert.ok(!("founded" in value));
  assert.deepEqual(value.contact, {});
});

test("chybné hodnoty se hlásí všechny najednou, s cestou pole", () => {
  const keys = paramKeys(() =>
    validatePublic({
      notice: "x".repeat(201),
      founded: 1700,
      categoryOrder: "men-a",
      hideNamesAgeList: ["u99"],
      contact: { email: "a@b.cz", mapUrl: "javascript:alert(1)", fax: "1" },
      socialList: [{ code: "facebook", uri: "facebook.com/afk" }],
      unknown: true,
    }),
  );
  assert.deepEqual(keys, [
    "$.categoryOrder",
    "$.contact.fax",
    "$.contact.mapUrl",
    "$.founded",
    "$.hideNamesAgeList",
    "$.notice",
    "$.socialList",
    "$.unknown",
  ]);
  assert.deepEqual(paramKeys(() => validatePublic({ fileCategoryList: [{ code: "x" }] })), ["$.fileCategoryList"]);
  assert.deepEqual(paramKeys(() => validatePrivate({ fileCategoryList: [] })), ["$.fileCategoryList"]);
});
