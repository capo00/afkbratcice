// Odjezd zápasu z „HH:MM:SS“ na ISO, 2026-11 (review 2026-11-12, 5.4; Caio 2026-11-18).
//
//   npm run migrate:departure-time                          # plán proti .env.development, nic nezapíše
//   npm run migrate:departure-time -- --commit              # zápis
//   npm run migrate:departure-time -- --env .env [--commit] # produkce -- JEN po Caiově „ano“ těsně předem
//
// v0 ukládal odjezd jen jako místní čas („15:45:00“), datum bylo implicitně den zápasu. Web
// ale čeká ISO jako u výkopu (`time`), takže členové místo odjezdu viděli „—“. Odjezd se
// posadí na český den výkopu se stejným českým časem (`server/services/prague-time.js`, totéž
// dělá `match/crud.js` při každém zápisu).
//
// - ISO hodnota se nechá být -- opakovaný běh nic neudělá dvakrát.
// - Zápas bez výkopu nebo s nečitelným odjezdem se jen vypíše.
// - Odjezd po výkopu se převede taky (údaj zůstane), ale vypíše se k ruční opravě: při další
//   změně termínu nebo odjezdu ho server odmítne.
import { runScript } from "caio-server/script"; // FIRST import -- it loads the env file
import { MongoClient } from "mongodb";
import serverConfig from "../server/server.config.js";
import { departureOnMatchDay } from "../server/services/prague-time.js";

const CLOCK = /^\d{1,2}:\d{2}(:\d{2})?$/;

await runScript({
  name: "migrate-departure-time",
  config: serverConfig,
  reportFile: "migrate-departure-time-report.json",
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

      const withDeparture = await matches.find({ departureTime: { $nin: [null, ""] } }).sort({ time: 1 }).toArray();
      report.matches = { withDeparture: withDeparture.length, alreadyIso: 0, converted: 0, afterKickoff: [], skipped: [] };

      for (const m of withDeparture) {
        if (!CLOCK.test(String(m.departureTime))) {
          report.matches.alreadyIso++;
          continue;
        }
        const departureTime = departureOnMatchDay(m.departureTime, m.time);
        if (!departureTime) {
          report.matches.skipped.push(`${label(m)}: odjezd ${m.departureTime}, výkop ${m.time ?? "chybí"}`);
          continue;
        }
        if (new Date(departureTime) > new Date(m.time)) {
          report.matches.afterKickoff.push(`${label(m)}: odjezd ${m.departureTime} je po výkopu ${m.time}`);
        }
        log(`${label(m)}: ${m.departureTime} -> ${departureTime}`);
        report.matches.converted++;
        if (commit) await matches.updateOne({ _id: m._id }, { $set: { departureTime, "sys.mts": now } });
      }

      for (const s of report.matches.skipped) log(`left as is -- ${s}`);
      for (const a of report.matches.afterKickoff) log(`converted, fix by hand -- ${a}`);
      log(
        `departures: ${report.matches.converted} converted, ${report.matches.alreadyIso} already ISO, ${report.matches.skipped.length} left as is, ${report.matches.afterKickoff.length} after the kick-off`,
      );
    } finally {
      await client.close().catch(() => {});
    }
    return 0;
  },
});
