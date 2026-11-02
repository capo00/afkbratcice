import caioConfig from "../../caio.config.js";

// Nastavení klubu, které mění správce za běhu (vrstva 3, `sys_settings.app`): upozornění, kontakt,
// sítě, pořadí kategorií, kde se skrývají jména dětí, rok založení a kategorie souborů ke stažení.
// Do 2026-11 kolekce `afk_config` a use casy `appConfig/*`.
//
// Výchozí hodnoty a rozdělení na `public` / `private` jsou v caio.config.js `app.settingsDefaults`
// (zná je i klient). Čte se tu přímo ze souboru, ne přes `AppConfig` caio-serveru: tenhle modul
// importuje i skript přesunu dat (tools/migrate-settings.js), jehož dry run caio-server načíst
// nesmí (Dao při importu zakládají indexy).

const { settingsDefaults } = caioConfig.app;

// Co vidí jen server a správce (`app.private`; dnes nic), všechno ostatní je veřejné (`app.public`).
const PRIVATE_KEY_LIST = Object.freeze(Object.keys(settingsDefaults.private));

// Plochý tvar, jak ho čte zbytek serveru (a jak ho vracel `appConfig/get`).
const DEFAULT_APP_SETTINGS = Object.freeze({ ...settingsDefaults.public, ...settingsDefaults.private });

/** Plochý tvar -> `{ public, private }`, jak ho ukládá `sys_settings.app`. */
function toStoredApp(flat) {
  const result = { public: {}, private: {} };
  for (const [key, value] of Object.entries(flat ?? {})) {
    result[PRIVATE_KEY_LIST.includes(key) ? "private" : "public"][key] = value;
  }
  return result;
}

/** `sys_settings.app` -> plochý tvar doplněný o výchozí hodnoty. */
function fromStoredApp(app) {
  return { ...DEFAULT_APP_SETTINGS, ...app?.public, ...app?.private };
}

export { DEFAULT_APP_SETTINGS, PRIVATE_KEY_LIST, toStoredApp, fromStoredApp };
