import { Settings, Validator, Error as CoreError } from "caio-server";
import Config from "../config.js";
import { fromStoredApp } from "./defaults.js";

// Nastavení klubu (`sys_settings.app`, design/config.md): čtení pro zbytek serveru a validátory
// pro `App.init({ settings })`. Use casy (`sys/settings/*`) i obrazovku dodává stack; formulář
// sekce klubu je client/src/admin/settings.js.

/**
 * Nastavení klubu v plochém tvaru (`notice`, `contact`, `categoryOrder`, …, `fileCategoryList`),
 * doplněné o výchozí hodnoty. Čte se při každém dotazu: `Settings.get()` odpovídá z paměti
 * a obnovuje se sám (caio-server README, *Settings*).
 */
async function getAppSettings() {
  const { app } = await Settings.get();
  return fromStoredApp(app);
}

const isText = (value) => typeof value === "string" && value.trim() !== "";
const isUrl = (value) => /^https?:\/\/\S+$/.test(value);

// Seznam kódů (pořadí kategorií, věkové skupiny): pole neprázdných řetězců bez opakování.
function readCodeList(v, value, key, allowedList) {
  if (value == null) return [];
  const ok =
    Array.isArray(value) &&
    value.length <= 100 &&
    value.every((code) => isText(code) && (!allowedList || allowedList.includes(code))) &&
    new Set(value).size === value.length;
  return v.check(ok, key) ? value.map((code) => code.trim()) : null;
}

// Seznam položek `{ code, <field> }` (sítě, kategorie souborů).
function readItemList(v, value, key, field, check = isText) {
  if (value == null) return [];
  const ok =
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every((item) => item && isText(item.code) && isText(item[field]) && check(item[field].trim()) && Object.keys(item).length === 2);
  return v.check(ok, key) ? value.map((item) => ({ code: item.code.trim(), [field]: item[field].trim() })) : null;
}

/** `app.public` -- validátor pro `App.init({ settings: { validatePublic } })`. */
function validatePublic(value) {
  const v = Validator.create(CoreError.code("settings"));
  const text = (maxLength) => (x, key) => v.string(x, key, { maxLength });

  const result = {
    notice: v.string(value.notice, "notice", { maxLength: 200 }) ?? "",
    founded: v.int(value.founded, "founded", { min: 1800, max: new Date().getFullYear() }),
    categoryOrder: readCodeList(v, value.categoryOrder, "categoryOrder"),
    hideNamesAgeList: readCodeList(v, value.hideNamesAgeList, "hideNamesAgeList", Config.AGE_LIST),
    contact:
      v.shape(value.contact, "contact", {
        address: text(200),
        email: text(200),
        phone: text(50),
        ico: text(20),
        // „49.0759N, 16.4952E“ -- tak, jak ho člověk zkopíruje z mapy (routes/kontakt.jsx).
        gps: text(50),
        // Vlastní výřez mapy na /kontakt (src iframu), jinak mapa z `gps`.
        mapUrl: (x, key) => {
          const url = v.string(x, key, { maxLength: 2000 });
          return url == null || v.check(isUrl(url), key) ? url : null;
        },
      }) ?? {},
    socialList: readItemList(v, value.socialList, "socialList", "uri", isUrl),
    fileCategoryList: readItemList(v, value.fileCategoryList, "fileCategoryList", "name"),
  };
  for (const key of Object.keys(value)) if (!Object.hasOwn(result, key)) v.invalid(key);
  v.assert();
  // `founded` je nepovinný; prázdný ho nechá na výchozí hodnotě (app-settings/defaults.js).
  if (result.founded == null) delete result.founded;
  return result;
}

/**
 * `app.private` -- validátor pro `App.init({ settings: { validatePrivate } })`. Klub tam nic nemá
 * (caio.config.js `settingsDefaults`), takže jediná platná hodnota je `{}`.
 */
function validatePrivate(value) {
  const v = Validator.create(CoreError.code("settings"));
  for (const key of Object.keys(value)) v.invalid(key);
  v.assert();
  return {};
}

export { getAppSettings, validatePublic, validatePrivate };
