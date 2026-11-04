// Vedení klubu z tvaru „záznam na osobu“ na „záznam na funkci“ (`afk_management`,
// design/data-model.md, sekce 7), 2026-11.
//
//   npm run migrate:management-flat                          # plán proti .env.development, nic nezapíše
//   npm run migrate:management-flat -- --commit              # zápis
//   npm run migrate:management-flat -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// Do v0.7.0 měla osoba jeden záznam s vnořenými seznamy:
//   { personId, teamList: [{ id, role, dateFrom, dateTo }], boardList: [{ role, dateFrom, dateTo, showContact }] }
// Nově je každá položka samostatný záznam:
//   { personId, teamId (null = výbor), role, dateFrom, dateTo, showContact }
//
// 1. Zahodí unique index `personId_1` -- osoba má teď víc záznamů. Bez toho by druhý vložený
//    záznam téže osoby spadl na duplicitě.
// 2. Každý záznam ve starém tvaru (má `teamList` nebo `boardList`) rozloží na záznamy funkcí
//    a starý smaže. Položka bez funkce (nemělo by nastat) se jen zapíše do reportu.
//
// - **Opakovatelný.** Záznam v novém tvaru (bez `teamList`/`boardList`) přeskočí.
// - **Pořadí při vydání**: před nasazením verze, která čte nový tvar (README, *Vydání*).
//   Starý server nový tvar nepřečte -- návrat na předchozí verzi znamená obnovit zálohu kolekce.
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { MongoClient } from "mongodb";
import serverConfig from "../server/server.config.js";

const COLLECTION = "afk_management";
const OLD_UNIQUE_INDEX = "personId_1";

/** Záznamy funkcí ze starého záznamu osoby. */
function flatten(old) {
  const base = { personId: old.personId };
  const team = (old.teamList ?? []).map((m) => ({
    ...base,
    teamId: m.id ?? null,
    role: m.role ?? null,
    dateFrom: m.dateFrom ?? null,
    dateTo: m.dateTo ?? null,
    showContact: false,
  }));
  const board = (old.boardList ?? []).map((m) => ({
    ...base,
    teamId: null,
    role: m.role ?? null,
    dateFrom: m.dateFrom ?? null,
    dateTo: m.dateTo ?? null,
    showContact: Boolean(m.showContact),
  }));
  return [...team, ...board];
}

await runScript({
  name: "migrate-management-flat",
  config: serverConfig,
  reportFile: "migrate-management-flat-report.json",
  async run({ commit, report, log }) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    await client.connect();
    try {
      const coll = client.db().collection(COLLECTION);
      const now = new Date().toISOString();

      // --- 1. index ------------------------------------------------------------------------
      const indexList = await coll.indexes().catch(() => []);
      const unique = indexList.find((i) => i.name === OLD_UNIQUE_INDEX && i.unique);
      report.droppedIndex = Boolean(unique);
      log(unique ? `drop unique index ${OLD_UNIQUE_INDEX}` : `no unique index ${OLD_UNIQUE_INDEX}`);
      if (unique && commit) await coll.dropIndex(OLD_UNIQUE_INDEX);

      // --- 2. záznamy ----------------------------------------------------------------------
      const oldList = await coll.find({ $or: [{ teamList: { $exists: true } }, { boardList: { $exists: true } }] }).toArray();
      report.records = { old: oldList.length, created: 0, withoutRole: [], alreadyFlat: 0 };
      report.records.alreadyFlat = await coll.countDocuments({ teamList: { $exists: false }, boardList: { $exists: false } });

      for (const old of oldList) {
        const itemList = flatten(old);
        const missing = itemList.filter((m) => !m.role);
        for (const m of missing) report.records.withoutRole.push(`${old.personId} ${m.teamId ?? "board"}`);
        const valid = itemList.filter((m) => m.role);
        log(
          `person ${old.personId}: ${valid.map((m) => `${m.role}@${m.teamId ?? "board"} ${m.dateFrom ?? "?"}–${m.dateTo ?? ""}`).join(", ") || "-"}`,
        );
        report.records.created += valid.length;
        if (!commit) continue;
        if (valid.length) {
          await coll.insertMany(valid.map((m) => ({ ...m, sys: { cts: old.sys?.cts ?? now, mts: now } })));
        }
        await coll.deleteOne({ _id: old._id });
      }

      for (const w of report.records.withoutRole) log(`skipped (no role): ${w}`);
      log(
        `${report.records.old} person records -> ${report.records.created} role records; ${report.records.alreadyFlat} already flat`,
      );
    } finally {
      await client.close().catch(() => {});
    }
    return 0;
  },
});
