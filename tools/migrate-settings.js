// Přesun konfigurace klubu z kolekce `afk_config` do Nastavení (`sys_settings.app`), 2026-11.
//
//   npm run migrate:settings                          # plán proti .env.development, nic nezapíše
//   npm run migrate:settings -- --commit              # zápis
//   npm run migrate:settings -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// Server od 2026-11 čte konfiguraci (upozornění, kontakt, sítě, pořadí kategorií, skrytá jména,
// rok založení, kategorie souborů) z Nastavení; `afk_config` už nečte nic. Skript ji jednou
// zkopíruje: uložený dokument doplněný o výchozí hodnoty (server/app-settings/defaults.js), takže
// web po přesunu ukazuje totéž co před ním -- i když `afk_config` v databázi není (pak jen výchozí
// hodnoty). Všechno jde do `app.public` (`app.private` klub nemá, caio.config.js `settingsDefaults`).
//
// - **Nikdy nepřepíše**: když `sys_settings` část `app` už má, skončí bez zápisu (hodnoty se pak
//   mění v administraci, Nastavení -> záložka klubu).
// - **`afk_config` nechává být** -- je zálohou pro návrat na předchozí verzi.
// - **Pořadí při vydání**: až po `npm run migrate:categories` (ten `afk_config` ještě převádí)
//   a před nasazením nové verze (README, *Vydání*).
// - **Dry run nezapíše nic**: čte přes `caio-server/settings-read` a holý MongoClient, caio-server
//   (jehož Dao při importu zakládají indexy) nenačte. `--commit` ho načte -- cílová databáze pak
//   dostane kolekci `sys_settings` a indexy Dao caio-serveru (`sys_identity`, …); před během proti
//   produkci to říct.
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { readStoredSettings } from "caio-server/settings-read";
import { MongoClient } from "mongodb";
import serverConfig from "../server/server.config.js";
import { DEFAULT_APP_SETTINGS, toStoredApp } from "../server/app-settings/defaults.js";

const SOURCE_COLLECTION = "afk_config";

async function readSource() {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  try {
    await client.connect();
    // `find` nad kolekcí, která není, vrátí prázdno a nic nezaloží.
    return await client.db().collection(SOURCE_COLLECTION).findOne({});
  } finally {
    await client.close().catch(() => {});
  }
}

await runScript({
  name: "migrate-settings",
  config: serverConfig,
  async run({ commit, report, log, fail }) {
    if (!process.env.MONGODB_URI) fail("MONGODB_URI is not set.");

    const { storedParts } = await readStoredSettings();
    report.storedParts = storedParts;
    if (storedParts.includes("app")) {
      log("sys_settings already has the app part -- nothing to do (change it in the settings screen)");
      report.result = "skipped";
      return 0;
    }

    const source = await readSource();
    // `_id` a `sys` patří Dao, `id` vracel starý use case; do Nastavení nepatří.
    const { _id, id, sys, ...stored } = source ?? {};
    const value = toStoredApp({ ...DEFAULT_APP_SETTINGS, ...stored });

    report.source = source ? SOURCE_COLLECTION : null;
    report.fromSource = Object.keys(stored).sort();
    report.fromDefaults = Object.keys(DEFAULT_APP_SETTINGS).filter((key) => !(key in stored)).sort();
    report.public = Object.keys(value.public).sort();
    report.private = Object.keys(value.private).sort();
    log(`source: ${source ? SOURCE_COLLECTION : `no ${SOURCE_COLLECTION} document, defaults only`}`);
    log(`from source: ${report.fromSource.join(", ") || "-"}; defaults: ${report.fromDefaults.join(", ") || "-"}`);
    log(`app.public: ${report.public.join(", ")}; app.private: ${report.private.join(", ")}`);

    if (!commit) {
      log("plan only; the app's validators run with --commit");
      report.result = "planned";
      return 0;
    }

    // Až teď: caio-server zakládá při importu indexy svých Dao.
    const { Settings } = await import("caio-server");
    const { validatePublic, validatePrivate } = await import("../server/app-settings/index.js");
    const app = { public: validatePublic(value.public), private: validatePrivate(value.private) };
    const created = await Settings.createIfAbsent("app", app);
    report.result = created ? "created" : "skipped";
    log(created ? "sys_settings.app created" : "sys_settings.app appeared meanwhile -- not overwritten");
    return 0;
  },
});
