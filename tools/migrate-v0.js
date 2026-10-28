// Migrace sportovních dat z v0 (MySQL dump) do Monga -- celá historie od 2012.
//
//   node tools/migrate-v0.js [cesta/k/dumpu.sql] [--dry]
//
// Nahrazuje tools/migrate-2026.js (jeden ročník, ještě bez klubů a kategorií). Předpoklad:
// kategorie existují (`npm run migrate:categories`). Rozhodnutí, ze kterých to vychází
// (Caio, 2026-10-25 a 26), jsou v design/migration.md, sekce 8:
//
// - Klub určuje jméno týmu bez koncového „ B“/„ C“ (rezerva sdílí klub s áčkem); Ronov
//   a Zruč se sjednotí s „… nad Doubravou“/„… nad Sázavou“, ženské týmy patří ke klubu
//   města s kategorií `women`. Tým si nechá celé jméno z v0.
// - Kategorie: M -> men-a/men-b/men-c podle koncovky, D -> u19, Z -> u15 (rezerva u15-b),
//   S -> old, ženské týmy women.
// - Sezóna = ročník (hranice 30. 6.) a věková skupina, jen tam, kde se hrály mistrovské
//   zápasy. Přátelák patří do sezóny vlastního týmu, a když v tom ročníku žádnou nemá,
//   zmigruje se bez sezóny.
// - Názvy soutěží jsou ruční tabulka níž (v datech nejsou).
// - Zápasy 1010, 1021 a 1037 se přeskakují: duplicity zápasů 1052, 1053 a 1055 s chybně
//   vybraným týmem žáků Štrampouchu (bez skóre, sestavy i článku).
// - Články, fotogalerie, soubory a klubová kasa se nemigrují (design/migration.md).
//
// Pouští se opakovaně: co už v Mongu je, se najde přes `afk_migration_map` (v0 id -> _id)
// a aktualizuje. Osoby se párují podle loginu z v0, ne podle jména -- v datech jsou dva
// různí „Vladimír Kupera“. Časy: dump má `SET time_zone = "+00:00"`, takže `datum` už je UTC.
import fs from "fs";
import path from "path";
import "caio-server/src/caio-server-app/config/env.js";
import { Dao, BinaryStore } from "caio-server";
import { MongoClient } from "mongodb";
import teamDao from "../server/team/dao.js";
import clubDao from "../server/club/dao.js";
import categoryDao from "../server/category/dao.js";
import seasonDao from "../server/season/dao.js";
import matchDao from "../server/match/dao.js";
import personDao from "../server/person/dao.js";
import playerDao from "../server/player/dao.js";
import coachDao from "../server/coach/dao.js";
import { checkMatchAges } from "../server/services/category.js";
import { LINEUP_POSITION_BY_V0, LINEUP_POSITION_MAP } from "../server/services/lineup-position.js";

// --- parametry -----------------------------------------------------------------------

const HOME = process.env.USERPROFILE ?? process.env.HOME ?? ".";
const DEFAULT_DUMP = path.join(HOME, "Documents", "caio-share", "d27814_afk_2026-10-26.sql");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const DUMP = args.find((a) => !a.startsWith("--")) ?? DEFAULT_DUMP;
// Den exportu z názvu dumpu (`..._YYYY-MM-DD.sql`); bez něj dnešek. Končí jím členství
// neaktivního hráče, o kterém v0 neví, kdy z týmu odešel.
const EXPORT_DATE = path.basename(DUMP).match(/(\d{4}-\d{2}-\d{2})\.sql$/)?.[1] ?? new Date().toISOString().slice(0, 10);

const SKIP_MATCH = new Set([1010, 1021, 1037]);

// Duplicitní hráč v sestavách: `puro00` není v tabulce `hrac` a ve všech třech zápasech
// (1857, 1863, 1870, jaro 2024) hraje na stejném postu vedle `shpo00` -- je to týž hráč
// zapsaný dvakrát (Caio, 2026-10-26). Jeho řádek se vynechá a góly a karty se připíší
// hráči, za kterého je duplicitou.
const MERGE_LOGIN = { puro00: "shpo00" };

/** Názvy soutěží: věková skupina -> [od ročníku, do ročníku, název]. */
const COMPETITION = {
  men: [
    [2012, 2013, "III. třída"],
    [2014, 2020, "IV. třída"],
    [2021, 2026, "III. třída"],
  ],
  u15: [
    [2012, 2012, "5. liga - Starší žáci"],
    [2025, 2026, "5. liga - Starší žáci"],
  ],
  u19: [[2026, 2026, "6. liga - Dorost"]],
};

/** Jméno týmu -> jméno klubu, kde nestačí odříznout „ B“/„ C“. */
const CLUB_NAME = {
  Ronov: "Ronov nad Doubravou",
  "Zruč": "Zruč nad Sázavou",
  "FK Čáslav (ženy)": "Čáslav",
  "Sparta Kutná Hora (ženy)": "Kutná Hora",
};

const OWN_TEAM_NAME = "AFK Bratčice";
const POSITION_BY_FORMACE = { B: "GK", O: "DF", Z: "MF", U: "FW" };
const BASE_CATEGORY_BY_VEK = { M: "men-a", D: "u19", Z: "u15", S: "old" };

// --- parser dumpu (stejný jako migrate-2026.js) ---------------------------------------

const SQL = fs.readFileSync(DUMP, "utf8");

/** Rozdělí `(1,'a'),(2,'b')` na řádky; hlídá uvozovky, `''` i zpětná lomítka. */
function splitRows(body) {
  const rows = [];
  let row = null, value = "", inString = false, escaped = false;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];

    if (inString) {
      if (escaped) { value += ch === "n" ? "\n" : ch === "r" ? "\r" : ch === "t" ? "\t" : ch; escaped = false; }
      else if (ch === "\\") escaped = true;
      else if (ch === "'") {
        if (body[i + 1] === "'") { value += "'"; i++; }
        else { inString = false; row.push(value); value = ""; }
      } else value += ch;
      continue;
    }

    if (ch === "(" && !row) { row = []; value = ""; continue; }
    if (!row) continue;
    if (ch === "'") { inString = true; value = ""; continue; }
    if (ch === "," || ch === ")") {
      const raw = value.trim();
      if (raw !== "") row.push(raw === "NULL" ? null : isNaN(Number(raw)) ? raw : Number(raw));
      value = "";
      if (ch === ")") { rows.push(row); row = null; }
      continue;
    }
    value += ch;
  }
  return rows;
}

function sqlTable(name) {
  const re = new RegExp("INSERT INTO `" + name + "` \\(([^)]+)\\) VALUES\\s*([\\s\\S]*?);\\s*\\n", "g");
  const out = [];
  let m;
  while ((m = re.exec(SQL))) {
    const cols = m[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    for (const row of splitRows(m[2])) {
      const item = {};
      cols.forEach((c, i) => (item[c] = row[i] === undefined ? null : row[i]));
      out.push(item);
    }
  }
  return out;
}

// --- pomocné -------------------------------------------------------------------------

const warnings = [];
const warn = (text) => warnings.push(text);
const stat = {};
const count = (entity, kind) => {
  stat[entity] = stat[entity] ?? { created: 0, updated: 0 };
  stat[entity][kind]++;
};

const migrationMapDao = new (class extends Dao {
  constructor() { super("afk_migration_map"); }
  createIndexes() { return this.createIndex({ entity: 1, v0Id: 1 }, { unique: true }); }
})();

let dryId = 0;

/**
 * Založí nebo aktualizuje dokument. Nejdřív podle mapy v0 id (opakovaný běh), pak podle
 * přirozeného klíče `filter` (když ho entita má), jinak založí nový.
 */
async function upsert(entity, v0Id, dao, data, filter) {
  let existing = null;
  if (v0Id !== undefined) {
    const mapped = await migrationMapDao.findOne({ entity, v0Id: String(v0Id) });
    if (mapped) existing = await dao.get(mapped.targetId).catch(() => null);
  }
  if (!existing && filter) existing = await dao.findOne(filter);

  let saved;
  if (DRY) {
    saved = existing ? { ...existing, ...data } : { id: `dry-${entity}-${++dryId}`, ...data };
  } else if (existing) {
    saved = await dao.update({ ...existing, ...data, id: existing.id });
  } else {
    saved = await dao.create(data);
  }
  count(entity, existing ? "updated" : "created");

  if (v0Id !== undefined && !DRY) {
    const mapped = await migrationMapDao.findOne({ entity, v0Id: String(v0Id) });
    if (mapped) await migrationMapDao.update({ ...mapped, id: mapped.id, targetId: saved.id });
    else await migrationMapDao.create({ entity, v0Id: String(v0Id), targetId: saved.id });
  }
  return saved;
}

/** `2017-09-17 15:00:00` (UTC) -> `2017-09-17T15:00:00.000Z`. */
const toIso = (datum) => (datum ? new Date(datum.replace(" ", "T") + "Z").toISOString() : null);
/** Ročník podle data; hranice 30. 6. (v0 ji nikde nedrží, ročníky začínají koncem července). */
const yearOf = (datum) => (datum.slice(5) >= "06-30" ? Number(datum.slice(0, 4)) : Number(datum.slice(0, 4)) - 1);
const isLeague = (z) => z.kolo !== null && z.kolo !== "" && z.kolo !== 0;

const clubNameOf = (teamName) => CLUB_NAME[teamName] ?? teamName.replace(/ [BC]$/, "");

function categoryOfV0(t) {
  if (/\(ženy\)/i.test(t.nazev)) return "women";
  const base = BASE_CATEGORY_BY_VEK[t.vek];
  if (!base) return null;
  const reserve = t.nazev.match(/ ([BC])$/)?.[1]?.toLowerCase();
  if (!reserve || base === "old") return base;
  return base === "men-a" ? `men-${reserve}` : `${base}-${reserve}`;
}

function competitionOf(age, year) {
  return (COMPETITION[age] ?? []).find(([from, to]) => year >= from && year <= to)?.[2] ?? null;
}

// --- data z dumpu --------------------------------------------------------------------

const v0Teams = sqlTable("tym");
const v0Matches = sqlTable("zapas").filter((z) => !SKIP_MATCH.has(z.id));
const v0Players = sqlTable("hrac");
const v0Lineups = sqlTable("ucast");
const v0Coaches = sqlTable("trener");
// Přesný post v sestavě z `ucast.role` (services/lineup-position.js); linie se dopočítá.
const unknownRoles = sqlTable("post").filter((p) => p.zkratka !== "STR" && !LINEUP_POSITION_BY_V0[p.zkratka]);
if (unknownRoles.length) {
  console.error(`Post v0 bez anglického kódu: ${unknownRoles.map((p) => p.zkratka).join(", ")}`);
  process.exit(1);
}
const v0TeamById = Object.fromEntries(v0Teams.map((t) => [t.id, t]));

console.log(`Dump: ${DUMP}${DRY ? "  [DRY RUN]" : ""}`);
console.log(`${v0Teams.length} týmů, ${v0Matches.length} zápasů (${SKIP_MATCH.size} přeskočeno), ${v0Players.length} hráčů, ${v0Lineups.length} zápisů v sestavách\n`);

// --- 0. starý unikátní index zápasu -------------------------------------------------
// Index bez kola by odmítl druhý mistrovský zápas stejné dvojice v sezóně (server/match/dao.js).

const mongo = new MongoClient(process.env.MONGODB_URI);
await mongo.connect();
const db = mongo.db();
if (!DRY) {
  for (const index of await db.collection("afk_match").indexes().catch(() => [])) {
    const keys = Object.keys(index.key ?? {});
    if (index.unique && keys.join() === "seasonId,homeTeamId,guestTeamId") {
      await db.collection("afk_match").dropIndex(index.name);
      console.log(`index afk_match.${index.name} smazán (nový má i kolo)`);
    }
  }
}

// --- 1. kategorie --------------------------------------------------------------------

const categoryList = await categoryDao.find({});
const ageByCategory = Object.fromEntries(categoryList.map((c) => [c.code, c.age]));
const neededCategories = [...new Set(v0Teams.map(categoryOfV0))];
const missingCategories = neededCategories.filter((code) => !code || !ageByCategory[code]);
if (missingCategories.length) {
  console.error(`Chybí kategorie ${missingCategories.join(", ")} -- nejdřív npm run migrate:categories.`);
  process.exit(1);
}

// --- 2. kluby ------------------------------------------------------------------------
// Nejdřív srovnat kluby, které už v databázi jsou (vznikly 2026-09-11 podle přesného jména,
// takže „Chotusice B“ je samostatný klub), pak dozaložit chybějící.

const clubByName = new Map((await clubDao.find({})).map((club) => [club.name, club]));

for (const club of [...clubByName.values()]) {
  const target = clubNameOf(club.name);
  if (target === club.name) continue;
  const into = clubByName.get(target);

  if (!into) {
    console.log(`  klub ${club.name} -> přejmenovat na ${target}`);
    if (!DRY) clubByName.set(target, await clubDao.update({ ...club, id: club.id, name: target }));
    else clubByName.set(target, { ...club, name: target });
    clubByName.delete(club.name);
    continue;
  }

  // Sloučení: týmy přepojit, logo převzít, jen když ho cílový klub nemá; jinak smazat.
  const keepLogo = !into.logoId && club.logoId;
  console.log(`  klub ${club.name} -> sloučit do ${target}${club.logoId ? (keepLogo ? " (převezme jeho logo)" : " (jeho logo se smaže)") : ""}`);
  if (!DRY) {
    if (keepLogo) clubByName.set(target, await clubDao.update({ ...into, id: into.id, logoId: club.logoId, logoUri: club.logoUri }));
    const target2 = clubByName.get(target);
    await db.collection("afk_team").updateMany({ clubId: club.id }, { $set: { clubId: target2.id, logoUri: target2.logoUri ?? null } });
    await clubDao.delete(club.id);
    if (club.logoId && !keepLogo) {
      try {
        await BinaryStore.Binary.delete(club.logoId);
      } catch (e) {
        warn(`logo klubu ${club.name} (${club.logoId}) se nepodařilo smazat: ${e?.message ?? e}`);
      }
    }
  }
  clubByName.delete(club.name);
}

for (const name of [...new Set(v0Teams.map((t) => clubNameOf(t.nazev)))]) {
  if (clubByName.has(name)) continue;
  count("club", "created");
  clubByName.set(name, DRY ? { id: `dry-club-${++dryId}`, name, logoUri: null } : await clubDao.create({ name, logoId: null, logoUri: null }));
}

// --- 3. týmy -------------------------------------------------------------------------

const teamIdByV0 = {};
const ageByV0Team = {};
const ownTeamIdByV0 = {};

for (const t of v0Teams) {
  const category = categoryOfV0(t);
  const club = clubByName.get(clubNameOf(t.nazev));
  const own = t.nazev === OWN_TEAM_NAME;
  const saved = await upsert(
    "team",
    t.id,
    teamDao,
    { name: t.nazev, category, own, clubId: club.id, logoUri: club.logoUri ?? null },
    { name: t.nazev, category },
  );
  teamIdByV0[t.id] = saved.id;
  ageByV0Team[t.id] = ageByCategory[category];
  if (own) ownTeamIdByV0[t.id] = saved.id;
}

// --- 4. sezóny ------------------------------------------------------------------------
// Jen ročník a věková skupina s mistrovskými zápasy. Týmy sezóny = kdo v nich hrál.

const seasonTeams = new Map(); // "rok|age" -> Set(v0 team id)
for (const z of v0Matches.filter(isLeague)) {
  const homeAge = ageByV0Team[z.idD];
  const guestAge = ageByV0Team[z.idH];
  const problem = checkMatchAges({ homeAge, guestAge, seasonAge: homeAge, friendly: false });
  if (problem) {
    warn(`zápas ${z.id} (${v0TeamById[z.idD].nazev} – ${v0TeamById[z.idH].nazev}, ${z.datum}): ${problem}, přeskočen`);
    SKIP_MATCH.add(z.id);
    continue;
  }
  const key = `${yearOf(z.datum)}|${homeAge}`;
  if (!seasonTeams.has(key)) seasonTeams.set(key, new Set());
  seasonTeams.get(key).add(z.idD).add(z.idH);
}

const seasonIdByKey = {};
for (const [key, v0TeamIdSet] of [...seasonTeams].sort()) {
  const [yearText, age] = key.split("|");
  const year = Number(yearText);
  const competition = competitionOf(age, year);
  if (!competition) {
    console.error(`Chybí název soutěže pro ${year}/${String(year + 1).slice(2)} a skupinu ${age}.`);
    process.exit(1);
  }
  const saved = await upsert(
    "season",
    undefined,
    seasonDao,
    {
      competition,
      yearFrom: String(year),
      age,
      teamList: [...v0TeamIdSet].map((id) => teamIdByV0[id]),
      // v0 eviduje rozstřel (`zapas.penalty`) a jeho tabulka počítá 3/2/1/0.
      hasPenalties: true,
    },
    { yearFrom: String(year), age },
  );
  seasonIdByKey[key] = saved.id;
}

// --- 5. osoby a hráči ----------------------------------------------------------------
// Členství v týmech z účasti v zápasech: tým AFK, za který hráč nastoupil, od prvního do
// posledního zápasu. Aktivní hráč (`aktivni = 1`) má otevřené členství ve svém týmu
// (`hrac.tym`: M muži, Z žáci, S stará garda). Neaktivní hráč, který za svůj tým nenastoupil,
// v něm má členství bez začátku, uzavřené dnem exportu (Caio 2026-10-28) -- jinak by bez
// data konce stál v aktuální soupisce.

const v0MatchById = Object.fromEntries(v0Matches.map((z) => [z.id, z]));
const membership = {}; // login -> v0 team id -> { from, to }
for (const u of v0Lineups) {
  const z = v0MatchById[u.zapas];
  if (!z) continue;
  const v0TeamId = ownTeamIdByV0[z.idD] ? z.idD : ownTeamIdByV0[z.idH] ? z.idH : null;
  if (!v0TeamId) continue;
  const byTeam = (membership[u.hrac] = membership[u.hrac] ?? {});
  const entry = (byTeam[v0TeamId] = byTeam[v0TeamId] ?? { from: z.datum, to: z.datum });
  if (z.datum < entry.from) entry.from = z.datum;
  if (z.datum > entry.to) entry.to = z.datum;
}
const ownV0TeamByVek = Object.fromEntries(v0Teams.filter((t) => t.nazev === OWN_TEAM_NAME).map((t) => [t.vek, t.id]));

const personIdByLogin = {};
const playerIdByLogin = {};
for (const h of v0Players) {
  const person = await upsert("person", h.login, personDao, {
    name: h.jmeno,
    surname: h.prijmeni,
    ...(h.narozen ? { birthdate: h.narozen } : null),
    ...(h.mail ? { email: h.mail } : null),
    ...(h.telefon ? { phone: `+420${h.telefon}` } : null),
  });
  personIdByLogin[h.login] = person.id;

  const homeV0Team = ownV0TeamByVek[h.tym];
  const played = membership[h.login] ?? {};
  const v0TeamIdList = [...new Set([...Object.keys(played).map(Number), ...(homeV0Team ? [homeV0Team] : [])])];
  const teamList = v0TeamIdList.map((v0TeamId) => {
    const range = played[v0TeamId];
    const open = h.aktivni === 1 && v0TeamId === homeV0Team;
    return {
      id: teamIdByV0[v0TeamId],
      dateFrom: range ? range.from.slice(0, 10) : null,
      dateTo: open ? null : range ? range.to.slice(0, 10) : EXPORT_DATE,
    };
  });

  const player = await upsert(
    "player",
    h.login,
    playerDao,
    { personId: person.id, ...(POSITION_BY_FORMACE[h.post] ? { position: POSITION_BY_FORMACE[h.post] } : null), teamList },
    { personId: person.id },
  );
  playerIdByLogin[h.login] = player.id;
}

// --- 6. trenéři ----------------------------------------------------------------------

for (const c of v0Coaches) {
  const personId = personIdByLogin[c.login];
  const v0TeamId = ownV0TeamByVek[c.tym];
  if (!personId || !v0TeamId) {
    warn(`trenér ${c.id} (${c.login}, ${c.tym}): osoba nebo tým nenalezen, přeskočen`);
    continue;
  }
  await upsert("coach", c.id, coachDao, {
    personId,
    role: "headCoach",
    teamList: [{ id: teamIdByV0[v0TeamId], dateFrom: c.od, dateTo: c.do ?? null }],
  });
}

// --- 7. zápasy -----------------------------------------------------------------------

const lineupByMatch = {};
for (const u of v0Lineups) {
  if (MERGE_LOGIN[u.hrac]) continue;
  (lineupByMatch[u.zapas] = lineupByMatch[u.zapas] ?? []).push({ ...u });
}
// Góly a karty duplicitního záznamu k hráči, za kterého je (MERGE_LOGIN).
for (const u of v0Lineups.filter((x) => MERGE_LOGIN[x.hrac])) {
  const target = (lineupByMatch[u.zapas] ?? []).find((x) => x.hrac === MERGE_LOGIN[u.hrac]);
  if (!target) {
    warn(`zápas ${u.zapas}: ${u.hrac} se má sloučit do ${MERGE_LOGIN[u.hrac]}, ten ale v sestavě není -- zápis přeskočen`);
    continue;
  }
  target.goly = (target.goly ?? 0) + (u.goly ?? 0) || null;
  if (u.zluta === 1) target.zluta = 1;
  if (u.cervena === 1) target.cervena = 1;
  if (u.goly || u.zluta === 1 || u.cervena === 1) {
    warn(`zápas ${u.zapas}: ${u.hrac} sloučen do ${MERGE_LOGIN[u.hrac]} (gólů ${u.goly ?? 0}${u.zluta === 1 ? ", ŽK" : ""}${u.cervena === 1 ? ", ČK" : ""})`);
  }
}
const unknownLogins = new Set();

for (const z of v0Matches) {
  if (SKIP_MATCH.has(z.id)) continue;
  const year = yearOf(z.datum);
  let seasonId = null;
  if (isLeague(z)) {
    seasonId = seasonIdByKey[`${year}|${ageByV0Team[z.idD]}`];
  } else {
    // Přátelák: sezóna vlastního týmu v tom ročníku, jinak sezóna domácích, jinak bez sezóny.
    const ownSide = ownTeamIdByV0[z.idD] ? z.idD : ownTeamIdByV0[z.idH] ? z.idH : z.idD;
    seasonId = seasonIdByKey[`${year}|${ageByV0Team[ownSide]}`] ?? seasonIdByKey[`${year}|${ageByV0Team[z.idD]}`] ?? null;
  }

  const playerList = (lineupByMatch[z.id] ?? [])
    .filter((u) => {
      if (playerIdByLogin[u.hrac]) return true;
      unknownLogins.add(u.hrac);
      return false;
    })
    .map((u) => ({
      playerId: playerIdByLogin[u.hrac],
      // STR není post, ale střídání (design/data-model.md, sekce 13).
      ...(LINEUP_POSITION_BY_V0[u.role]
        ? { positionDetail: LINEUP_POSITION_BY_V0[u.role], position: LINEUP_POSITION_MAP[LINEUP_POSITION_BY_V0[u.role]] }
        : {}),
      substitute: u.role === "STR",
      goals: u.goly ?? 0,
      yellowCard: u.zluta === 1,
      redCard: u.cervena === 1,
    }));

  const played = z.golyD !== null && z.golyH !== null;
  await upsert("match", z.id, matchDao, {
    seasonId,
    round: isLeague(z) ? String(z.kolo) : null,
    time: toIso(z.datum),
    place: z.hriste ?? null,
    departureTime: z.odjezd ?? null,
    homeTeamId: teamIdByV0[z.idD],
    guestTeamId: teamIdByV0[z.idH],
    homeGoals: z.golyD,
    guestGoals: z.golyH,
    homeGoalsHalf: z.golyDP,
    guestGoalsHalf: z.golyHP,
    penaltyWinnerTeamId: z.penalty ? teamIdByV0[z.penalty] ?? null : null,
    playerList,
    state: played ? "played" : "planned",
  });
  if (!seasonId) warn(`zápas ${z.id} (${v0TeamById[z.idD].nazev} – ${v0TeamById[z.idH].nazev}, ${z.datum.slice(0, 10)}): přátelák bez sezóny`);
}
for (const login of unknownLogins) warn(`hráč ${login} je v sestavách, ale ne v tabulce hrac -- jeho zápisy přeskočeny`);

// --- shrnutí -------------------------------------------------------------------------

await mongo.close();
console.log("");
for (const [entity, { created, updated }] of Object.entries(stat)) {
  console.log(`${entity.padEnd(8)} nových ${String(created).padStart(5)} | aktualizovaných ${String(updated).padStart(5)}`);
}
console.log(`sezón celkem ${Object.keys(seasonIdByKey).length}: ${Object.keys(seasonIdByKey).sort().join(", ")}`);
if (warnings.length) {
  console.log(`\nVarování (${warnings.length}):`);
  for (const w of warnings) console.log("  " + w);
}
console.log(DRY ? "\nDRY RUN -- nic se nezapsalo." : "\nHotovo.");
process.exit(0);
