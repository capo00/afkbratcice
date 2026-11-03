// Oprava zápasů s penaltovým rozstřelem z importu v0, 2026-11.
//
//   npm run migrate:penalties                          # plán proti .env.development, nic nezapíše
//   npm run migrate:penalties -- --commit              # zápis
//   npm run migrate:penalties -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// v0 ukládal do skóre i rozhodující gól rozstřelu: remíza 2:2 vyhraná na penalty byla 3:2
// s `penalty` = vítěz. Import to převzal beze změny, takže všech 96 rozstřelů (muži, IV. třída
// 2014/15–2020/21) vypadá jako běžná výhra o gól -- server přitom vítěze rozstřelu bere jen
// u remízy (`match/crud.js`) a tabulka je počítala 3/0 místo 2/1 (`services/table.js`).
//
// 1. **Zápas s `penaltyWinnerTeamId`, kde vítěz rozstřelu vede přesně o gól** -> vítězi o gól
//    méně (remíza + vítěz rozstřelu). Jiný stav (už remíza, jiný rozdíl, vede poražený) se
//    jen vypíše a nemění -- opakovaný běh tak nic neudělá dvakrát.
// 2. **Sezóna bez jediného rozstřelu** -> `hasPenalties: false`. Import ho dal všem 19
//    sezónám, i těm, kde se rozstřel nikdy nehrál.
//
// Poločas se nemění: v něm rozstřel není.
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { MongoClient, ObjectId } from "mongodb";
import serverConfig from "../server/server.config.js";

await runScript({
  name: "migrate-penalties",
  config: serverConfig,
  reportFile: "migrate-penalties-report.json",
  async run({ commit, report, log }) {
    const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
    await client.connect();
    try {
      const db = client.db();
      const now = new Date().toISOString();
      const matches = db.collection("afk_match");

      const teamName = new Map(
        (await db.collection("afk_team").find({}, { projection: { name: 1 } }).toArray()).map((t) => [String(t._id), t.name]),
      );
      const label = (m) =>
        `${String(m.time ?? "").slice(0, 10)} ${teamName.get(m.homeTeamId) ?? m.homeTeamId} – ${teamName.get(m.guestTeamId) ?? m.guestTeamId}`;

      // --- 1. skóre ----------------------------------------------------------------------
      const shootoutList = await matches.find({ penaltyWinnerTeamId: { $nin: [null, ""] } }).sort({ time: 1 }).toArray();
      report.matches = { withShootout: shootoutList.length, fixed: 0, alreadyDraw: 0, anomalies: [] };
      for (const m of shootoutList) {
        const homeWon = m.penaltyWinnerTeamId === m.homeTeamId;
        const winnerGoals = homeWon ? m.homeGoals : m.guestGoals;
        const loserGoals = homeWon ? m.guestGoals : m.homeGoals;
        if (winnerGoals === loserGoals) {
          report.matches.alreadyDraw++;
          continue;
        }
        if (!Number.isFinite(winnerGoals) || winnerGoals - loserGoals !== 1) {
          report.matches.anomalies.push(`${label(m)} ${m.homeGoals}:${m.guestGoals}, PK ${teamName.get(m.penaltyWinnerTeamId)}`);
          continue;
        }
        const set = homeWon ? { homeGoals: m.homeGoals - 1 } : { guestGoals: m.guestGoals - 1 };
        const next = { homeGoals: m.homeGoals, guestGoals: m.guestGoals, ...set };
        log(`${label(m)}: ${m.homeGoals}:${m.guestGoals} -> ${next.homeGoals}:${next.guestGoals}, PK ${teamName.get(m.penaltyWinnerTeamId)}`);
        report.matches.fixed++;
        if (commit) await matches.updateOne({ _id: m._id }, { $set: { ...set, "sys.mts": now } });
      }
      for (const a of report.matches.anomalies) log(`left as is -- ${a}`);

      // --- 2. sezóny -----------------------------------------------------------------------
      const seasonIdWithShootout = new Set(shootoutList.map((m) => m.seasonId).filter(Boolean));
      const seasonList = await db.collection("afk_season").find({ hasPenalties: true }).toArray();
      const withoutShootout = seasonList.filter((s) => !seasonIdWithShootout.has(String(s._id)));
      report.seasons = { withPenalties: seasonList.length, switchedOff: withoutShootout.length };
      for (const s of withoutShootout) log(`season ${s.competition} ${s.yearFrom} (${s.age}): hasPenalties -> false`);
      if (commit && withoutShootout.length) {
        await db.collection("afk_season").updateMany(
          { _id: { $in: withoutShootout.map((s) => new ObjectId(s._id)) } },
          { $set: { hasPenalties: false, "sys.mts": now } },
        );
      }

      log(
        `matches: ${report.matches.fixed} fixed, ${report.matches.alreadyDraw} already a draw, ${report.matches.anomalies.length} left as is; seasons: ${withoutShootout.length} without a shootout switched off`,
      );
    } finally {
      await client.close().catch(() => {});
    }
    return 0;
  },
});
