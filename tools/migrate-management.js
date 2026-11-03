// Trenéři a výbor do nového modelu vedení (`afk_management`, design/data-model.md, sekce 7), 2026-11.
//
//   npm run migrate:management                          # plán proti .env.development, nic nezapíše
//   npm run migrate:management -- --commit              # zápis
//   npm run migrate:management -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// Dělá tři věci (0. opraví telefony osob se zdvojenou předvolbou `+420420…` z importu v0):
// 1. **`afk_coach` -> `afk_management`.** Dřív byl záznam na dvojici osoba + funkce, teď jeden
//    na osobu: funkce se přesune do položky `teamList` (`headCoach` je nově `coach`), `board`
//    do `boardList` (funkce `member`, období z prvního členství).
// 2. **Výbor ze stránky `/vybor`.** Ta byla do 2026-11 psaný text (`page-content.js`); teď ji
//    kreslí `management/list?board=true`. Členy z toho textu skript založí: osobu najde podle
//    jména a příjmení (chybějící založí, chybějící e-mail a telefon doplní, jiné nepřepíše),
//    začátek ve výboru nechá prázdný (neznáme ho). Kontakt na webu (`showContact`) má jen předseda.
//
// - **Opakovatelný.** Osoba, která už v `afk_management` je, se nepřevádí znovu; výbor se jen
//   doplní, když tam ta funkce chybí.
// - **`afk_coach` nechává být** -- záloha pro návrat na předchozí verzi; smaže se ručně, až
//   nová verze poběží.
// - **Pořadí při vydání**: před nasazením verze, která čte `management/*` (README, *Vydání*).
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { MongoClient } from "mongodb";
import serverConfig from "../server/server.config.js";

const SOURCE_COLLECTION = "afk_coach";
const TARGET_COLLECTION = "afk_management";

// Text stránky `/vybor` k 2026-11-03 (předtím `client/src/content/page-content.js`).
const BOARD = [
  { name: "Jaroslav", surname: "Doležal", role: "chairman", phone: "+420605907732", email: "dolezalj@szdc.cz", showContact: true },
  { name: "Luboš", surname: "Říha", role: "viceChairman", phone: "+420605039810", email: "lubosriha58@seznam.cz" },
  { name: "Ondřej", surname: "Čapek", role: "secretary", phone: "+420737870746", email: "admin@afkbratcice.cz" },
  { name: "Václav", surname: "Říha", role: "member", email: "venda.riha@atlas.cz" },
  { name: "Petra", surname: "Zajícová", role: "member", email: "peta.zajicova@gmail.com" },
  { name: "Jan", surname: "Tichý", role: "member", email: "jan.tichy89@gmail.com" },
  { name: "Martin", surname: "Kaňka", role: "member", email: "martinkanka2@seznam.cz" },
];

const ROLE_RENAME = { headCoach: "coach" };

const DOUBLED_PREFIX = /^\+420420\d{9}$/;
const fixPhone = (phone) => (DOUBLED_PREFIX.test(phone ?? "") ? `+420${phone.slice(-9)}` : phone);

/** Záznamy `afk_coach` sloučené podle osoby do tvaru `afk_management`. */
function mergeCoaches(coachList) {
  const byPerson = new Map();
  for (const c of coachList) {
    const item = byPerson.get(c.personId) ?? { personId: c.personId, teamList: [], boardList: [] };
    const memberships = c.teamList ?? [];
    if (c.role === "board") {
      const first = memberships[0] ?? {};
      item.boardList.push({ role: "member", dateFrom: first.dateFrom ?? null, dateTo: first.dateTo ?? null });
    } else {
      const role = ROLE_RENAME[c.role] ?? c.role;
      for (const t of memberships) {
        item.teamList.push({ id: t.id, role, dateFrom: t.dateFrom ?? null, dateTo: t.dateTo ?? null });
      }
    }
    byPerson.set(c.personId, item);
  }
  return [...byPerson.values()];
}

await runScript({
  name: "migrate-management",
  config: serverConfig,
  reportFile: "migrate-management-report.json",
  async run({ commit, report, log }) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    await client.connect();
    try {
      const db = client.db();
      const now = () => new Date().toISOString();
      const sys = () => ({ cts: now(), mts: now() });

      // --- 0. telefony osob -------------------------------------------------------------
      // Import z v0 přidával `+420` k číslu, které už předvolbu mělo (`+420420605…`). Na web
      // se telefon dostane poprvé teď (výbor), tak se opraví tady.
      const brokenPhoneList = await db.collection("afk_person").find({ phone: DOUBLED_PREFIX }).toArray();
      report.phonesFixed = brokenPhoneList.length;
      log(`phones with a doubled +420: ${brokenPhoneList.length}`);
      if (commit) {
        for (const p of brokenPhoneList) {
          await db.collection("afk_person").updateOne({ _id: p._id }, { $set: { phone: fixPhone(p.phone), "sys.mts": now() } });
        }
      }

      // --- 1. trenéři ------------------------------------------------------------------
      const existing = new Map(
        (await db.collection(TARGET_COLLECTION).find({}).toArray()).map((m) => [m.personId, m]),
      );
      const merged = mergeCoaches(await db.collection(SOURCE_COLLECTION).find({}).toArray());
      report.coaches = { source: merged.length, created: 0, skipped: 0 };
      for (const item of merged) {
        if (existing.has(item.personId)) {
          report.coaches.skipped++;
          continue;
        }
        log(`coach ${item.personId}: ${item.teamList.map((t) => `${t.role}@${t.id}`).join(", ") || "-"}`);
        if (commit) {
          const { insertedId } = await db.collection(TARGET_COLLECTION).insertOne({ ...item, sys: sys() });
          existing.set(item.personId, { _id: insertedId, ...item });
        }
        report.coaches.created++;
      }

      // --- 2. výbor --------------------------------------------------------------------
      report.board = { personsCreated: 0, personsUpdated: 0, membersAdded: 0, unchanged: 0, conflicts: [] };
      for (const b of BOARD) {
        const label = `${b.name} ${b.surname} (${b.role})`;
        let person = await db.collection("afk_person").findOne({ name: b.name, surname: b.surname });
        if (!person) {
          log(`person ${label}: new`);
          report.board.personsCreated++;
          if (commit) {
            const doc = { name: b.name, surname: b.surname, email: b.email ?? null, phone: b.phone ?? null, sys: sys() };
            const { insertedId } = await db.collection("afk_person").insertOne(doc);
            person = { _id: insertedId, ...doc };
          }
        } else {
          const set = {};
          for (const field of ["email", "phone"]) {
            if (!b[field]) continue;
            const stored = field === "phone" ? fixPhone(person[field]) : person[field];
            if (!stored) set[field] = b[field];
            else if (stored !== b[field]) report.board.conflicts.push(`${label}: ${field} ${person[field]} != ${b[field]}`);
          }
          if (Object.keys(set).length) {
            log(`person ${label}: + ${Object.keys(set).join(", ")}`);
            report.board.personsUpdated++;
            if (commit) await db.collection("afk_person").updateOne({ _id: person._id }, { $set: { ...set, "sys.mts": now() } });
          }
        }
        if (!person) {
          report.board.membersAdded++;
          continue; // plán: osoba by vznikla, záznam vedení s ní taky
        }

        const personId = String(person._id);
        const membership = { role: b.role, dateFrom: null, dateTo: null, showContact: Boolean(b.showContact) };
        const current = existing.get(personId);
        if (current?.boardList?.some((m) => m.role === b.role)) {
          report.board.unchanged++;
          continue;
        }
        log(`board ${label}${current ? " (to existing record)" : ""}`);
        report.board.membersAdded++;
        if (!commit) continue;
        if (current) {
          await db.collection(TARGET_COLLECTION).updateOne(
            { _id: current._id },
            { $push: { boardList: membership }, $set: { "sys.mts": now() } },
          );
        } else {
          const doc = { personId, teamList: [], boardList: [membership], sys: sys() };
          const { insertedId } = await db.collection(TARGET_COLLECTION).insertOne(doc);
          existing.set(personId, { _id: insertedId, ...doc });
        }
      }
      for (const c of report.board.conflicts) log(`kept stored value -- ${c}`);
      log(`coaches: ${report.coaches.created} new, ${report.coaches.skipped} already there; board: ${report.board.membersAdded} added, ${report.board.unchanged} already there`);
    } finally {
      await client.close().catch(() => {});
    }
    return 0;
  },
});
