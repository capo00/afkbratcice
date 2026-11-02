import { Utils } from "uu5g05";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";

// Sekce klubu na obrazovce Nastavení z caio-ui (`UiAuth.Settings`, záložka vedle Pošty
// a Registrace; screens/config.jsx). Do 2026-11 vlastní obrazovka nad `appConfig/*`, teď část
// `app` nastavení nasazení (`sys_settings`), kterou ukládá stack (`sys/settings/update`) a server
// validuje (server/app-settings/). Appka si píše jen pole a převod: `Fields` jsou její
// `Uu5Forms.Form*` uvnitř společného formuláře, `toForm`/`fromForm` mapují `app` ze serveru na
// jejich hodnoty a zpátky. Jména polí nesmí začínat `sys.` -- ta jsou stacku.
//
// `Fields` je lazy: tenhle soubor jde přes admin/app.jsx do bundlu administrace, pole
// s uu5g05-forms se stáhnou, až správce Nastavení otevře.
const Fields = Utils.Component.lazy(() => import("./settings-fields.jsx"));

// Kontakt je v nastavení objekt (`contact.address`, …), ve formuláři plochá pole.
const CONTACT_FIELD_LIST = ["address", "email", "phone", "ico", "gps", "mapUrl"];
// Sítě jsou seznam `{ code, uri }`, ve formuláři jedno pole na síť, v pořadí z client.config.js.
// Síť, kterou appka nezná (není v `socialLabel`), formulář nezobrazí a uložení ji vynechá.
const SOCIAL_CODE_LIST = Object.keys(Config.SOCIAL_LABEL);
const socialFieldName = (code) => `social_${code}`;

const text = (value) => (typeof value === "string" ? value.trim() : "");

/** Uložené `app` -> hodnoty polí. Co uložené není, má výchozí hodnotu z caio.config.js. */
function toForm(app) {
  const settings = { ...Config.SETTINGS_DEFAULTS.public, ...app.public };
  const contact = settings.contact ?? {};
  const uriByCode = Object.fromEntries((settings.socialList ?? []).map((item) => [item.code, item.uri]));

  return {
    notice: settings.notice ?? "",
    founded: settings.founded,
    categoryOrder: settings.categoryOrder ?? [],
    hideNamesAgeList: settings.hideNamesAgeList ?? [],
    // Bez pole (seznam se v Nastavení zatím needituje), jen projde formulářem.
    fileCategoryList: settings.fileCategoryList ?? [],
    ...Object.fromEntries(CONTACT_FIELD_LIST.map((key) => [key, contact[key] ?? ""])),
    ...Object.fromEntries(SOCIAL_CODE_LIST.map((code) => [socialFieldName(code), uriByCode[code] ?? ""])),
  };
}

/**
 * Hodnoty polí -> `app.public`. Server úroveň nahradí celou, takže se vrací všechno, co v ní je --
 * i kategorie souborů, které formulář needituje: jdou z `toForm` jako hodnota bez pole
 * (uu5g05-forms ji drží a pošle zpátky beze změny). `app.private` klub nemá.
 */
function fromForm(values) {
  return {
    public: {
      notice: text(values.notice),
      // Prázdný rok založení server vynechá a platí výchozí.
      founded: values.founded ?? null,
      categoryOrder: values.categoryOrder ?? [],
      hideNamesAgeList: values.hideNamesAgeList ?? [],
      // GPS drží řetězec „49.0759N, 16.4952E" — tak, jak ho člověk zkopíruje z mapy.
      // Rozpad na dvě čísla by znamenal dvě pole navíc a jednu chybu navíc.
      contact: Object.fromEntries(
        CONTACT_FIELD_LIST.map((key) => [key, text(values[key])]).filter(([, value]) => value),
      ),
      socialList: SOCIAL_CODE_LIST.map((code) => ({ code, uri: text(values[socialFieldName(code)]) })).filter(
        (item) => item.uri,
      ),
      fileCategoryList: values.fileCategoryList ?? [],
    },
  };
}

// Chyba serveru na `$.app.public.<klíč>` -> pole. Kontakt je vnořený, sítě jsou jeden seznam
// (chyba jde do souhrnu nad záložkami).
const FIELD_BY_PATH = {
  notice: "notice",
  founded: "founded",
  categoryOrder: "categoryOrder",
  hideNamesAgeList: "hideNamesAgeList",
  ...Object.fromEntries(CONTACT_FIELD_LIST.map((key) => [`contact.${key}`, key])),
};

function fieldOf(path) {
  const match = /^\$\.app\.public\.(.+)$/.exec(path);
  return (match && FIELD_BY_PATH[match[1]]) ?? null;
}

const APP_SETTINGS = {
  label: lsi("admin", "config", "label"),
  Fields,
  toForm,
  fromForm,
  fieldOf,
};

export { APP_SETTINGS, CONTACT_FIELD_LIST, SOCIAL_CODE_LIST, socialFieldName };
