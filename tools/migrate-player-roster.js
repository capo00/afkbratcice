// Členství hráčů v týmech z hráče do soupisky (`afk_roster`, design/data-model.md, sekce 6.1),
// 2026-11.
//
//   npm run migrate:player-roster                          # plán proti .env.development, nic nezapíše
//   npm run migrate:player-roster -- --commit              # zápis
//   npm run migrate:player-roster -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// Do v0.7.0 měl hráč členství vnořené a číslo dresu:
//   afk_player { personId, position, number, teamList: [{ id, dateFrom, dateTo }], note }
// Nově je hráč jen karta a členství je soupiska:
//   afk_player { personId, position, note }
//   afk_roster { playerId, teamId, dateFrom, dateTo }
//
// 1. Každou položku `teamList` zapíše jako záznam soupisky; záznam se stejným hráčem, týmem
//    a začátkem, který už v soupisce je, nevloží znovu.
// 2. Hráči odebere `teamList` a `number` (číslo dresu se nově neeviduje) a zahodí index
//    `teamList.id_1`.
//
// - **Opakovatelný.** Hráč bez `teamList` a `number` se přeskočí.
// - **Pořadí při vydání**: před nasazením verze, která čte soupisku (README, *Vydání*).
//   Starý server soupisku nečte -- návrat na předchozí verzi znamená obnovit zálohu `afk_player`.
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { MongoClient } from "mongodb";
import serverConfig from "../server/server.config.js";

const PLAYER = "afk_player";
const ROSTER = "afk_roster";
const OLD_INDEX = "teamList.id_1";

await runScript({
  name: "migrate-player-roster",
  config: serverConfig,
  reportFile: "migrate-player-roster-report.json",
  async run({ commit, report, log }) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    await client.connect();
    try {
      const db = client.db();
      const players = db.collection(PLAYER);
      const roster = db.collection(ROSTER);
      const now = new Date().toISOString();

      const oldList = await players.find({ $or: [{ teamList: { $exists: true } }, { number: { $exists: true } }] }).toArray();
      const existing = await roster.find({}).toArray();
      const keyOf = (r) => `${r.playerId}|${r.teamId}|${r.dateFrom ?? ""}`;
      const known = new Set(existing.map(keyOf));
      report.players = { old: oldList.length, rosterCreated: 0, rosterAlreadyThere: 0, withoutTeam: [] };

      for (const player of oldList) {
        const playerId = String(player._id);
        const rowList = (player.teamList ?? []).map((m) => ({
          playerId,
          teamId: m.id ?? null,
          dateFrom: m.dateFrom ?? null,
          dateTo: m.dateTo ?? null,
        }));
        for (const r of rowList.filter((r) => !r.teamId)) report.players.withoutTeam.push(playerId);
        const newRowList = rowList.filter((r) => r.teamId && !known.has(keyOf(r)));
        report.players.rosterAlreadyThere += rowList.filter((r) => r.teamId).length - newRowList.length;
        report.players.rosterCreated += newRowList.length;
        log(
          `player ${playerId}${player.number != null ? ` (#${player.number} dropped)` : ""}: ${
            newRowList.map((r) => `${r.teamId} ${r.dateFrom ?? "?"}–${r.dateTo ?? ""}`).join(", ") || "-"
          }`,
        );
        if (!commit) continue;
        if (newRowList.length) {
          await roster.insertMany(newRowList.map((r) => ({ ...r, sys: { cts: player.sys?.cts ?? now, mts: now } })));
          for (const r of newRowList) known.add(keyOf(r));
        }
        await players.updateOne({ _id: player._id }, { $unset: { teamList: "", number: "" }, $set: { "sys.mts": now } });
      }

      const indexList = await players.indexes().catch(() => []);
      report.droppedIndex = indexList.some((i) => i.name === OLD_INDEX);
      log(report.droppedIndex ? `drop index ${OLD_INDEX}` : `no index ${OLD_INDEX}`);
      if (report.droppedIndex && commit) await players.dropIndex(OLD_INDEX);

      for (const id of report.players.withoutTeam) log(`skipped membership without team: player ${id}`);
      log(
        `${report.players.old} players -> ${report.players.rosterCreated} roster rows (${report.players.rosterAlreadyThere} already there)`,
      );
    } finally {
      await client.close().catch(() => {});
    }
    return 0;
  },
});
