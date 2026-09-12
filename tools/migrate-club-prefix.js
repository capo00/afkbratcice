// Jednorázová migrace k 2026-09-11.
//
//   node tools/migrate-club-prefix.js [--dry]
//
// Dvě věci najednou, protože druhá staví na první:
//
// 1) Přejmenuje kolekce appky na prefix `afk_` (`team` -> `afk_team`, `app_config` ->
//    `afk_config`, ...). `sys_binary` a `sys_identity` zůstávají beze změny -- patří
//    knihovně `caio-server` a sdílí je i jiné appky nad stejným Mongem.
// 2) Založí `club` -- víc věkových kategorií stejného reálného klubu (stejné `team.name`,
//    např. "AFK Bratčice" v men/u14/u18) dřív neslo tři samostatně nahrané erby. Skript
//    vybere z nich jeden kanonický (první nalezený s logem), napojí `team.clubId` na
//    všechny týmy té skupiny a zahodí zbylé duplicitní binárky, aby v bucketu neosiřely.
//
// Pouští se JEDNOU. Druhý běh nic nerozbije: přejmenování se přeskočí, když cíl už má
// dokumenty, a `team.clubId` skript nepřepisuje týmům, které ho už mají (viz níž).

import "caio-server/src/caio-server-app/config/env.js";
import { MongoClient } from "mongodb";
import { BinaryStore } from "caio-server";

const DRY = process.argv.includes("--dry");
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI není nastavené");
  process.exit(1);
}

const mongo = new MongoClient(uri);
await mongo.connect();
const db = mongo.db();

console.log(`Mongo: ${uri.replace(/\/\/.*@/, "//***@")}${DRY ? "  [DRY RUN]" : ""}\n`);

// --- 1. přejmenování kolekcí ----------------------------------------------------------

const RENAME_LIST = [
  ["team", "afk_team"],
  ["season", "afk_season"],
  ["match", "afk_match"],
  ["person", "afk_person"],
  ["player", "afk_player"],
  ["coach", "afk_coach"],
  ["gallery", "afk_gallery"],
  ["article", "afk_article"],
  ["app_config", "afk_config"],
  ["migration_map", "afk_migration_map"],
];

console.log("== 1. přejmenování kolekcí ==");
const existingNames = new Set((await db.listCollections().toArray()).map((c) => c.name));

for (const [from, to] of RENAME_LIST) {
  if (!existingNames.has(from)) {
    console.log(`  ${from.padEnd(16)} neexistuje, přeskakuji`);
    continue;
  }
  const fromCount = await db.collection(from).countDocuments();
  const toCount = existingNames.has(to) ? await db.collection(to).countDocuments() : 0;
  if (toCount > 0) {
    console.log(`  ${from.padEnd(16)} -> ${to}: cíl už má ${toCount} dokumentů, přeskakuji (asi už migrováno)`);
    continue;
  }
  console.log(`  ${from.padEnd(16)} -> ${to} (${fromCount} dokumentů)`);
  if (!DRY) await db.collection(from).rename(to, { dropTarget: true });
}
console.log("");

// --- 2. club -----------------------------------------------------------------------

console.log("== 2. club (jeden erb na klub, ne na tým) ==");

// Po přejmenování v kroku 1 je zdroj `afk_team`; v `--dry` běhu se nic nepřejmenovalo,
// takže se čte ještě ze `team`.
const afkTeamCount = existingNames.has("afk_team") ? await db.collection("afk_team").countDocuments() : 0;
const teamColName = DRY ? (afkTeamCount > 0 ? "afk_team" : "team") : "afk_team";
const teamCol = db.collection(teamColName);
const clubCol = db.collection("afk_club");

const teams = (await teamCol.find({}).toArray()).filter((t) => !t.clubId);
const alreadyLinked = (await teamCol.countDocuments({ clubId: { $exists: true, $ne: null } }));
if (alreadyLinked > 0) {
  console.log(`  ${alreadyLinked} týmů má clubId už nastavené, přeskakuji je (asi už migrováno)`);
}

const groups = new Map();
for (const t of teams) {
  if (!groups.has(t.name)) groups.set(t.name, []);
  groups.get(t.name).push(t);
}

let createdClubs = 0;
let linkedTeams = 0;
let discardedBinaries = 0;

for (const [name, group] of groups) {
  const withLogo = group.filter((t) => t.logoId);
  const canonical = withLogo[0];
  const discardedList = withLogo.slice(1);

  const ages = group.map((t) => t.age).join(",");
  const logoNote = canonical ? `, logo z age=${canonical.age}` : "";
  const discardNote = discardedList.length ? `, zahazuji ${discardedList.length} duplicitní(ch) logo(a)` : "";
  console.log(`  ${name.padEnd(24)} ${group.length} týmů (${ages})${logoNote}${discardNote}`);

  if (DRY) continue;

  const now = new Date().toISOString();
  const { insertedId } = await clubCol.insertOne({
    name,
    logoId: canonical?.logoId ?? null,
    logoUri: canonical?.logoUri ?? null,
    sys: { cts: now, mts: now },
  });
  createdClubs++;

  await teamCol.updateMany(
    { _id: { $in: group.map((t) => t._id) } },
    { $set: { clubId: String(insertedId), logoUri: canonical?.logoUri ?? null, "sys.mts": now }, $unset: { logoId: "" } },
  );
  linkedTeams += group.length;

  for (const dup of discardedList) {
    try {
      await BinaryStore.Binary.delete(dup.logoId);
      discardedBinaries++;
    } catch (e) {
      console.error(`    binárku ${dup.logoId} (${name}, age=${dup.age}) se nepodařilo smazat:`, e?.message ?? e);
    }
  }
}

console.log(
  `\n${DRY ? "[DRY] vzniklo by" : "vzniklo"} ${groups.size}${DRY ? "" : `/${createdClubs}`} klubů, ` +
    `napojilo by se ${teams.length}${DRY ? "" : `/${linkedTeams}`} týmů` +
    `${DRY ? "" : `, zahozeno ${discardedBinaries} duplicitních log`}.`,
);

await mongo.close();
