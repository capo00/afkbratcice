// Úklid mrtvých dat, 2026-11 (review 2026-11-12, 1.2 Mrtvý kód a 5.4 Kvalita dat).
//
//   npm run cleanup:dead-data                          # plán proti .env.development, nic nesmaže
//   npm run cleanup:dead-data -- --commit              # smazání
//   npm run cleanup:dead-data -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// 1. **Kolekce `afk_coach`.** Záloha pro návrat před `afk_management` (tools/migrate-management.js
//    ji schválně nechal být). Zahodí se celá, ale jen když má každé působení trenéra v ní řádek
//    v `afk_management` (stejná osoba a tým) -- jinak se vypíše, co chybí, a kolekce zůstane.
// 2. **Osiřelé binárky.** Záznam `sys_binary`, na který neodkazuje nic v žádné jiné kolekci (ani
//    `_id`, ani název objektu, ani adresa) -- typicky foto smazaného článku. Maže se přes
//    caio-server `BinaryStore`, tedy i objekt v bucketu (`GCS_BUCKET_NAME` z env souboru;
//    přihlášení do GCS je ADC: `gcloud auth application-default login`).
//
// `afk_migration_map` se **nemaže**: čte ji server/legacy-redirect.js pro staré adresy z v0.
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { MongoClient } from "mongodb";
import { BinaryStore } from "caio-server";
import serverConfig from "../server/server.config.js";

const COACH_COLLECTION = "afk_coach";

await runScript({
  name: "cleanup-dead-data",
  config: serverConfig,
  reportFile: "cleanup-dead-data-report.json",
  async run({ commit, report, log }) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    await client.connect();
    try {
      const db = client.db();
      const nameList = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);

      // -- 1. afk_coach --
      if (!nameList.includes(COACH_COLLECTION)) {
        log(`${COACH_COLLECTION}: not in the database, nothing to do`);
        report.coach = { present: false };
      } else {
        const coachList = await db.collection(COACH_COLLECTION).find().toArray();
        const managementList = await db.collection("afk_management").find({}, { projection: { personId: 1, teamId: 1 } }).toArray();
        const covered = new Set(managementList.map((m) => `${m.personId}|${m.teamId ?? ""}`));
        const missing = [];
        for (const coach of coachList) {
          for (const team of coach.teamList?.length ? coach.teamList : [{ id: null }]) {
            if (!covered.has(`${coach.personId}|${team.id ?? ""}`)) missing.push(`${coach._id}: person ${coach.personId}, team ${team.id}`);
          }
        }
        report.coach = { present: true, records: coachList.length, missing, dropped: false };
        if (missing.length) {
          for (const m of missing) log(`${COACH_COLLECTION}: not in afk_management -- ${m}`);
          log(`${COACH_COLLECTION}: ${missing.length} record(s) not migrated, the collection stays`);
        } else {
          log(`${COACH_COLLECTION}: all ${coachList.length} record(s) are in afk_management, dropping the collection`);
          if (commit) {
            await db.collection(COACH_COLLECTION).drop();
            report.coach.dropped = true;
          }
        }
      }

      // -- 2. orphan binaries --
      // Text of every other collection: a reference may sit in any field (photoId, photographId,
      // logoUri, a file list in settings...), so the search does not depend on knowing them all.
      const textList = [];
      for (const name of nameList.filter((n) => n !== "sys_binary" && !n.startsWith("system."))) {
        textList.push(JSON.stringify(await db.collection(name).find().toArray()));
      }
      const isReferenced = (key) => Boolean(key) && textList.some((text) => text.includes(key));

      const binaryList = await db.collection("sys_binary").find().toArray();
      const orphanList = binaryList.filter((b) => ![String(b._id), b.objectName, b.uri].some(isReferenced));
      report.binaries = {
        total: binaryList.length,
        orphans: orphanList.map((b) => ({ id: String(b._id), name: b.name, collection: b.collection, size: b.size, created: b.sys?.cts })),
        deleted: 0,
      };
      for (const b of orphanList) {
        log(`orphan binary ${b._id} "${b.name}" (${b.collection}, ${b.size} B, ${b.sys?.cts ?? "?"})`);
        if (commit) {
          await BinaryStore.Binary.delete(String(b._id));
          report.binaries.deleted++;
        }
      }
      log(`binaries: ${binaryList.length} in sys_binary, ${orphanList.length} orphan(s)${commit ? `, ${report.binaries.deleted} deleted` : ""}`);

    } finally {
      await client.close().catch(() => {});
    }
    return 0;
  },
});
