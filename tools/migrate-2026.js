// Migrace sezóny 2026 z v0 (MySQL dump) do Monga.
//
//   node tools/migrate-2026.js [cesta/k/dumpu.sql] [--dry] [--reset] [--v0]
//
// **Není to celá migrace** (ta je v design/migration.md, etapa 11) -- bere jen jeden
// ročník, aby appka běžela na reálných datech místo na seedu. Historii, soubory ke stažení
// a fotogalerii vědomě přeskakuje; `migration_map` ale plní, takže se na tenhle běh dá
// navázat.
//
// Pouští se **opakovaně**: všechno se hledá podle přirozeného klíče a aktualizuje, takže
// druhý běh nic nezduplikuje. Co v Mongu nevzniklo tímhle skriptem, nechává být.
//
// Časy: dump má v hlavičce `SET time_zone = "+00:00"`, takže `zapas.datum` UŽ JE v UTC
// a jen se k němu doplní `Z`. design/migration.md tvrdil "Europe/Prague → UTC" -- to by
// tenhle dump posunulo o dvě hodiny (ověřeno proti webu: 15:00 v dumpu = 17:00 na v0).

import fs from "fs";
import path from "path";
import "caio-server/src/caio-server-app/config/env.js";
import { Dao } from "caio-server";
import teamDao from "../server/team/dao.js";
import seasonDao from "../server/season/dao.js";
import matchDao from "../server/match/dao.js";
import personDao from "../server/person/dao.js";
import playerDao from "../server/player/dao.js";
import coachDao from "../server/coach/dao.js";
import appConfigDao from "../server/app-config/dao.js";
import articleCrud from "../server/article/crud.js";

// --- parametry -----------------------------------------------------------------------

const DEFAULT_DUMP = path.join(process.env.USERPROFILE ?? process.env.HOME ?? ".", "Documents", "caio-share", "d27814_afk.sql");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
// `--reset` vyhodí seed a naplní databázi znovu. Je to na první běh proti databázi se
// seedem: vymyšlené týmy ("Sokol Syrovice") a reálné soutěže vedle sebe dávají dvě sezóny
// téže kategorie a menu pak nabízí obojí. Co maže, je vypsané u samotného resetu níž.
const RESET = args.includes("--reset");
// `--v0` dotáhne z běžícího starého webu to, co v dumpu není: tělo článku a jeho titulní
// foto. Je to berlička do doby, než budou k dispozici soubory z v0 (`reporty/`,
// `galerie/clanky/`); proto je to volba, ne výchozí chování.
const V0 = args.includes("--v0");
const V0_BASE = "https://www.afkbratcice.cz";
const DUMP = args.find((a) => !a.startsWith("--")) ?? DEFAULT_DUMP;

/** Hranice ročníku. Sezóna 2026 = všechno od 30. 6. 2026 dál (v0 hranici nemá nikde uloženou). */
const SEASON_FROM = "2026-06-30";
const YEAR_FROM = "2026";

/** `tym.vek` → `AGE_MAP`. Potvrzeno proti v0: D je dorost, Z jsou starší žáci. */
const AGE_BY_VEK = { M: "men", D: "u18", Z: "u14", S: "old" };

// v0 název soutěže nikde nedrží -- ani v databázi, ani na webu. Doplnil je klub
// (2026-09-07); okresní soutěže na Kutnohorsku se číslují napříč kategoriemi.
const COMPETITION_BY_AGE = {
  men: "9. liga",
  u18: "6. liga",
  u14: "5. liga",
};

/** `post.formace` → `POSITION_MAP`. `STR` (střídání) není post, ale příznak. */
const POSITION_BY_FORMACE = { B: "GK", O: "DF", Z: "MF", U: "FW" };

/** `clanek.priorita` → `priority` + `state` (migration.md, 3.6). */
const ARTICLE_STATE_BY_PRIORITA = {
  default: { priority: 0, state: "published" },
  1: { priority: 1, state: "published" },
  2: { priority: 0, state: "archived" },
};

// --- parser dumpu --------------------------------------------------------------------

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

const migrationMapDao = new (class extends Dao {
  constructor() { super("migration_map"); }
  createIndexes() { return this.createIndex({ entity: 1, v0Id: 1 }, { unique: true }); }
})();

const stat = { team: [0, 0], season: [0, 0], match: [0, 0], person: [0, 0], player: [0, 0], coach: [0, 0], article: [0, 0] };
const count = (entity, created) => stat[entity][created ? 0 : 1]++;

/** Založí, nebo aktualizuje podle přirozeného klíče. Vrací uložený dokument. */
async function upsert(dao, entity, filter, data) {
  const existing = await dao.findOne(filter);
  if (DRY) { count(entity, !existing); return existing ?? { id: `dry-${entity}-${JSON.stringify(filter)}`, ...data }; }

  if (existing) {
    count(entity, false);
    return await dao.update({ ...existing, ...data, id: existing.id });
  }
  count(entity, true);
  return await dao.create(data);
}

async function remember(entity, v0Id, id) {
  if (DRY) return;
  const existing = await migrationMapDao.findOne({ entity, v0Id: String(v0Id) });
  if (existing) await migrationMapDao.update({ ...existing, id: existing.id, targetId: id });
  else await migrationMapDao.create({ entity, v0Id: String(v0Id), targetId: id });
}

/** `2026-09-05 15:00:00` (UTC v dumpu) → `2026-09-05T15:00:00.000Z`. */
const toIso = (datum) => (datum ? new Date(datum.replace(" ", "T") + "Z").toISOString() : undefined);

/**
 * Tělo článku z běžícího v0 (`/novinka-<id>`) převedené na `uu5String`.
 *
 * v0 vykresluje fragment s inline styly pro světlý web (`color: #222222`), které by v tmavém
 * motivu byly nečitelné, takže se **všechny atributy zahazují** a zůstává jen struktura.
 * `<h1>` uvnitř článku se mapuje na `<h3>`: titulek stránky vykresluje appka sama, tohle je
 * podnadpis. Odkaz na lightbox s fotkou taky ven -- fotka jde do `photographId`.
 */
async function fetchV0Body(v0Id) {
  const res = await fetch(`${V0_BASE}/novinka-${v0Id}`, { headers: { "user-agent": "afkbratcice v2 migrace" } });
  if (!res.ok) return null;

  const html = await res.text();
  const article = html.match(/<article[\s\S]*?<\/article>/)?.[0];
  if (!article) return null;

  const body = article
    .replace(/<a\b[\s\S]*?<\/a>/g, "")
    .replace(/<\/?(article|header|div)\b[^>]*>/g, "")
    .replace(/<h[12]\b[^>]*>/g, "<h3>").replace(/<\/h[12]>/g, "</h3>")
    .replace(/<(strong|b)\b[^>]*>/g, "<b>").replace(/<\/(strong|b)>/g, "</b>")
    .replace(/<(em|i)\b[^>]*>/g, "<i>").replace(/<\/(em|i)>/g, "</i>")
    .replace(/<p\b[^>]*>/g, "<p>")
    .replace(/<br\b[^>]*>/g, "<br/>")
    .replace(/<(?!\/?(p|h3|b|i|br|ul|ol|li)\b)[^>]*>/g, "")
    .split("\n").map((l) => l.trim()).filter(Boolean).join("\n")
    .replace(/\s*\n\s*(<\/?(p|h3|ul|ol|li))/g, "\n$1")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return body ? `<uu5string/>\n${body}` : null;
}

/**
 * Zahodí z těla odstavec, který jen opakuje perex.
 *
 * v0 nemá perex jako samostatné pole -- `clanek.popis` je ručně opsaná první věta článku,
 * takže tělo ji obsahuje znovu. Ve v2 je `desc` nad obsahem, takže by čtenář stejnou větu
 * dostal dvakrát pod sebou.
 */
function dropDuplicatePerex(body, perex) {
  if (!body || !perex) return body;

  // Porovnává se jen na písmenech a číslicích: v těle je věta rozsekaná značkami
  // (`<b>Miroslava Práška</b>,`), takže po odstranění tagů zbydou mezery na jiných místech
  // než v perexu a doslovná shoda by nikdy nenastala.
  const plain = (s) => s.replace(/<[^>]*>/g, " ").replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
  const needle = plain(perex);

  return body.replace(/<p>[\s\S]*?<\/p>/g, (paragraph) => (plain(paragraph) === needle ? "" : paragraph))
    .replace(/\n{2,}/g, "\n");
}

/**
 * Titulní foto článku. v0 ho drží jako `galerie/clanky/other/<soubor>.webp` -- ne
 * `reporty/<soubor>`, jak čekala migration.md, 3.6.
 *
 * Vrací tvar, jaký očekává `BinaryStore` od multeru (`buffer`, `mimetype`, `size`).
 */
async function fetchV0Photo(soubor) {
  if (!soubor) return null;

  for (const [ext, mimetype] of [["webp", "image/webp"], ["jpg", "image/jpeg"], ["png", "image/png"]]) {
    const res = await fetch(`${V0_BASE}/galerie/clanky/other/${soubor}.${ext}`, {
      headers: { "user-agent": "afkbratcice v2 migrace" },
    });
    if (!res.ok) continue;

    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, mimetype, size: buffer.length, originalname: `${soubor}.${ext}` };
  }
  return null;
}

// --- data z dumpu --------------------------------------------------------------------

const v0Teams = sqlTable("tym").filter((t) => t.rok2026 === 1);
const v0Matches = sqlTable("zapas").filter((m) => m.datum && m.datum >= SEASON_FROM);
const v0Players = sqlTable("hrac");
const v0Coaches = sqlTable("trener");
const v0Lineups = sqlTable("ucast");
const v0Articles = sqlTable("clanek").filter((a) => a.datum && a.datum >= SEASON_FROM);
const positionByCode = Object.fromEntries(sqlTable("post").map((p) => [p.zkratka, POSITION_BY_FORMACE[p.formace]]));

const matchIdSet = new Set(v0Matches.map((m) => m.id));
const lineups2026 = v0Lineups.filter((u) => matchIdSet.has(u.zapas));

console.log(`Dump: ${DUMP}`);
console.log(`Sezóna ${YEAR_FROM} (od ${SEASON_FROM}): ${v0Teams.length} týmů, ${v0Matches.length} zápasů, ${lineups2026.length} zápisů v sestavách, ${v0Articles.length} článků${DRY ? "  [DRY RUN]" : ""}\n`);

// --- 0. reset ------------------------------------------------------------------------

if (RESET && !DRY) {
  const { MongoClient } = await import("mongodb");
  const mongo = new MongoClient(process.env.MONGODB_URI);
  await mongo.connect();
  const db = mongo.db(new URL(process.env.MONGODB_URI).pathname.slice(1));

  // Fotogalerie a novinky jsou tu taky: byly to vymyšlené kusy seedu (alba „Klubový ples",
  // novinky „Zpráva z klubu č. 1-3") a nechat je vedle reálného rozlosování znamená web,
  // který si sám odporuje. Fotogalerie se navíc nemigruje vůbec -- fotky jedou přes
  // Facebook (README, sekce 2) --, takže po resetu zůstane prázdná, a to je správně.
  //
  for (const name of ["team", "season", "match", "person", "player", "coach", "gallery", "article", "migration_map"]) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    console.log(`  reset ${name.padEnd(14)} smazáno ${deletedCount}`);
  }

  // Z binárek jen ty, které **nejsou v bucketu**. Seed jich má dvacet a všechny míří na
  // statické assety (`/assets/meta/...`), takže se nemá co osiřet v GCS. Reálně nahraný
  // soubor by se smazáním záznamu v Mongu stal nedohledatelným objektem v bucketu, který
  // nikdo nikdy neuklidí -- proto to omezení, a ne prosté `deleteMany({})`.
  const { deletedCount: binCount } = await db
    .collection("sys_binary")
    .deleteMany({ uri: { $not: /^https:\/\/storage\.googleapis\.com\// } });
  console.log(`  reset ${"sys_binary".padEnd(14)} smazáno ${binCount} (jen mimo GCS)`);
  await mongo.close();
  console.log("");
}

// --- 1. týmy -------------------------------------------------------------------------

const teamIdByV0 = {};
const vekByV0Team = {};

for (const t of v0Teams) {
  const age = AGE_BY_VEK[t.vek];
  if (!age) throw new Error(`Neznámá kategorie "${t.vek}" u týmu ${t.id} (${t.nazev})`);

  const own = t.nazev === "AFK Bratčice";
  const saved = await upsert(teamDao, "team", { name: t.nazev, age }, { name: t.nazev, age, own });
  teamIdByV0[t.id] = saved.id;
  vekByV0Team[t.id] = t.vek;
  await remember("team", t.id, saved.id);
}

// --- 2. sezóny -----------------------------------------------------------------------

const seasonIdByAge = {};

for (const [vek, age] of Object.entries(AGE_BY_VEK)) {
  const teamList = v0Teams.filter((t) => t.vek === vek).map((t) => teamIdByV0[t.id]);
  if (!teamList.length) continue;

  const competition = COMPETITION_BY_AGE[age];
  if (!competition) throw new Error(`Chybí název soutěže pro kategorii ${age}`);

  // hasPenalties: v0 rozstřel eviduje (`zapas.penalty`) a jeho tabulka počítá 3/2/1/0
  // (cmd/controller/getTable.php), takže okresní soutěže rozstřel mají.
  // Klíč je `{ yearFrom, age }`, ne celá trojice z unikátního indexu: klub hraje v jedné
  // kategorii jednu soutěž za ročník, takže když se změní její název (a měnil se -- do
  // 7. 9. 2026 to byly odhady), má se přejmenovat existující sezóna. Kdyby se hledalo
  // i podle `competition`, vznikla by vedle ní druhá a zápasy by zůstaly viset na té staré.
  const saved = await upsert(
    seasonDao,
    "season",
    { yearFrom: YEAR_FROM, age },
    { competition, yearFrom: YEAR_FROM, age, teamList, hasPenalties: true },
  );
  seasonIdByAge[age] = saved.id;
}

// --- 3. osoby a hráči ----------------------------------------------------------------
//
// Soupisku bere jen z mužů: `hrac.tym` má hodnoty M/Z/S, ale skupina "Z" jsou dnes
// pětadvacetiletí -- je to zbytek žákovského týmu z let 2007-2013, ne dnešní mládež.
// Kdo dnes hraje za dorost a žáky, v0 v `hrac` vůbec nemá. Přidávají se k tomu hráči,
// kteří se objevili v sestavě zápasu 2026 (i kdyby byli vedení jako neaktivní).

const lineupLogins = new Set(lineups2026.map((u) => u.hrac));
const squad = v0Players.filter((h) => (h.aktivni === 1 && h.tym === "M") || lineupLogins.has(h.login));
const playerIdByLogin = {};

for (const h of squad) {
  const person = await upsert(
    personDao,
    "person",
    { name: h.jmeno, surname: h.prijmeni },
    {
      name: h.jmeno,
      surname: h.prijmeni,
      ...(h.narozen ? { birthdate: h.narozen } : null),
      ...(h.mail ? { email: h.mail } : null),
      ...(h.telefon ? { phone: `+420${h.telefon}` } : null),
    },
  );
  await remember("person", h.login, person.id);

  const teamId = teamIdByV0[1]; // AFK Bratčice muži
  const player = await upsert(
    playerDao,
    "player",
    { personId: person.id },
    {
      personId: person.id,
      ...(h.post ? { position: POSITION_BY_FORMACE[h.post] } : null),
      // `dateFrom` v0 neeviduje; `dateTo: null` = aktivní členství.
      teamList: [{ id: teamId, dateFrom: null, dateTo: h.aktivni === 1 ? null : `${YEAR_FROM}-06-30` }],
    },
  );
  playerIdByLogin[h.login] = player.id;
  await remember("player", h.login, player.id);
}

// --- 4. trenéři ----------------------------------------------------------------------
//
// v0 zná jen hlavního trenéra a jen u mužů; výbor (role `board`) v datech není, drží ho
// obsahová stránka `/vybor`.

for (const c of v0Coaches.filter((c) => !c.do && c.tym === "M")) {
  const h = v0Players.find((p) => p.login === c.login);
  if (!h) continue;

  const person = await upsert(
    personDao,
    "person",
    { name: h.jmeno, surname: h.prijmeni },
    { name: h.jmeno, surname: h.prijmeni, ...(h.mail ? { email: h.mail } : null) },
  );
  await upsert(
    coachDao,
    "coach",
    { personId: person.id, role: "headCoach" },
    { personId: person.id, role: "headCoach", teamList: [{ id: teamIdByV0[1], dateFrom: c.od, dateTo: null }] },
  );
}

// --- 5. zápasy -----------------------------------------------------------------------

const matchIdByV0 = {};
const lineupByMatch = {};
for (const u of lineups2026) (lineupByMatch[u.zapas] = lineupByMatch[u.zapas] ?? []).push(u);

for (const m of v0Matches) {
  const homeTeamId = teamIdByV0[m.idD];
  const guestTeamId = teamIdByV0[m.idH];
  if (!homeTeamId || !guestTeamId) {
    console.warn(`  přeskočeno: zápas ${m.id} má tým mimo sezónu ${YEAR_FROM} (${m.idD} vs ${m.idH})`);
    continue;
  }

  const age = AGE_BY_VEK[vekByV0Team[m.idD]];
  const seasonId = seasonIdByAge[age];

  const playerList = (lineupByMatch[m.id] ?? [])
    .filter((u) => playerIdByLogin[u.hrac])
    .map((u) => ({
      playerId: playerIdByLogin[u.hrac],
      // STR není post, ale střídání -- post takového hráče v0 neuloží, bere se jeho primární.
      position: u.role === "STR" ? undefined : positionByCode[u.role],
      substitute: u.role === "STR",
      goals: u.goly ?? 0,
      yellowCard: u.zluta === 1,
      redCard: u.cervena === 1,
    }));

  const data = {
    seasonId,
    round: m.kolo === null ? null : String(m.kolo),
    time: toIso(m.datum),
    ...(m.hriste ? { place: m.hriste } : null),
    ...(m.odjezd ? { departureTime: m.odjezd } : null),
    homeTeamId,
    guestTeamId,
    homeGoals: m.golyD,
    guestGoals: m.golyH,
    homeGoalsHalf: m.golyDP,
    guestGoalsHalf: m.golyHP,
    ...(m.penalty ? { penaltyWinnerTeamId: teamIdByV0[m.penalty] } : null),
    ...(playerList.length ? { playerList } : null),
    state: m.golyD === null ? "planned" : "played",
  };

  // Klíč je stejný jako unikátní index kolekce -- dvojice v jedné sezóně.
  const saved = await upsert(matchDao, "match", { seasonId, homeTeamId, guestTeamId }, data);
  matchIdByV0[m.id] = saved.id;
  await remember("match", m.id, saved.id);
}

// --- 6. články -----------------------------------------------------------------------
//
// **Tělo článku v dumpu není.** `clanek.popis` je perex (medián 192 znaků) a vlastní text
// je PHP fragment v `reporty/<soubor>.php`, který v0 includuje; titulní foto je
// `galerie/clanky/other/<soubor>.webp`. Platí to u všech 345 článků, takže plná migrace
// (migration.md, krok 9) potřebuje soubory z v0, ne jen databázi.
//
// Dokud je v0 v provozu, jde tělo i fotku vytáhnout z běžícího webu -- `--v0` to zapne.
// Bez něj se článek založí jen s perexem a řekne se to.

for (const a of v0Articles) {
  const { priority, state } = ARTICLE_STATE_BY_PRIORITA[a.priorita] ?? ARTICLE_STATE_BY_PRIORITA.default;
  const data = {
    name: a.nazev,
    desc: a.popis ?? "",
    ...(a.autor ? { author: a.autor } : null),
    ...(a.zapas && matchIdByV0[a.zapas] ? { matchId: matchIdByV0[a.zapas] } : null),
    priority,
    state,
    publishTime: toIso(a.datum),
  };

  let photograph;
  if (V0) {
    const body = dropDuplicatePerex(await fetchV0Body(a.id), a.popis);
    if (body) data.sectionList = [{ content: body }];
    else console.warn(`  článek ${a.id}: tělo se z v0 nepodařilo načíst, zůstane jen perex`);

    photograph = await fetchV0Photo(a.soubor);
    if (a.soubor && !photograph) console.warn(`  článek ${a.id}: titulní foto ${a.soubor} na v0 není`);
  } else if (a.soubor) {
    console.warn(`  článek ${a.id}: tělo a foto jsou na v0 v souborech, ne v dumpu -- spusť s --v0`);
  }

  const existing = await articleCrud.dao.findOne({ name: a.nazev, publishTime: data.publishTime });
  if (DRY) { count("article", !existing); continue; }

  if (existing) {
    count("article", false);
    // Fotka se posílá jen když článek žádnou nemá: `article/update` s `photograph` nahraje
    // nový objekt do bucketu a starý smaže, takže každý další běh migrace by zbytečně
    // přepisoval tutéž binárku a měnil jí uri.
    const withPhoto = photograph && !existing.photographId ? { photograph } : null;
    await articleCrud.update({ ...existing, id: existing.id, ...data, ...withPhoto });
    await remember("article", a.id, existing.id);
  } else {
    count("article", true);
    const saved = await articleCrud.create({ ...data, ...(photograph ? { photograph } : null) });
    await remember("article", a.id, saved.id);
  }
}

// --- 7. konfigurace ------------------------------------------------------------------
//
// Doplňuje jen to, co v0 opravdu má (proužek s tréninkem, kontakt, Facebook, rok
// založení). Běžný běh existující hodnoty nepřepisuje -- konfigurace se edituje
// v administraci a přepsat ji zpátky dumpem by bylo nemilé překvapení.
//
// S `--reset` se přepisuje: seed měl adresu a GPS **jiných** Bratčic (664 67 u Brna místo
// 285 06 u Čáslavi), takže tam nechat ho by znamenalo mapu na špatném konci republiky.

const config = (await appConfigDao.findOne({})) ?? null;
const fromV0 = {
  notice: "Trénink: pátek 17:00",
  contact: {
    address: "Bratčice 100, 285 06",
    gps: "49.853660, 15.423600",
    email: "admin@afkbratcice.cz",
  },
  socialList: [{ code: "facebook", uri: "https://www.facebook.com/afkbratcice" }],
  founded: 1932,
};

if (!DRY) {
  if (config) {
    const isEmpty = (v) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
    const patch = RESET ? fromV0 : Object.fromEntries(Object.entries(fromV0).filter(([k]) => isEmpty(config[k])));
    if (Object.keys(patch).length) await appConfigDao.update({ ...config, id: config.id, ...patch });
    console.log(`\nkonfigurace: ${RESET ? "přepsáno" : "doplněno"} ${Object.keys(patch).length} polí (${Object.keys(patch).join(", ") || "nic, už byla vyplněná"})`);
  } else {
    await appConfigDao.create(fromV0);
    console.log("\nkonfigurace: založena z v0");
  }
}

// --- shrnutí -------------------------------------------------------------------------

console.log("");
for (const [entity, [created, updated]] of Object.entries(stat)) {
  if (created || updated) console.log(`${entity.padEnd(8)} nových ${String(created).padStart(4)} | aktualizovaných ${String(updated).padStart(4)}`);
}
console.log(DRY ? "\nDRY RUN -- nic se nezapsalo." : "\nHotovo.");
process.exit(0);
