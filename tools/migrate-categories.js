// Kategorie týmů (afk_category) a přechod konfigurace na nové věkové skupiny (2026-10-26).
//
//   node tools/migrate-categories.js [--dry]
//
// 1) Založí výchozí kategorie, které ještě nejsou (podle `code`). Existující nepřepisuje:
//    názvy se od teď mění v administraci a migrace je nemá vracet zpátky.
// 2) Převede `afk_config`: `hideNamesAgeList` ze starých věků (u14, u12, …) na nové skupiny
//    (u15, u13, …) a `categoryOrder` z věků na kódy kategorií. Pořadí se jen přeloží, kategorie,
//    které v něm nebyly (B/C týmy, ženy), se přidají za ně ve výchozím pořadí.
// 3) Týmy se starým `age` a bez `category` dostanou kategorii podle věku a jména
//    (design/data-model.md, 2.3): muži men-a, jméno končící „ B“/„ C“ men-b/men-c, rezerva
//    mládeže <kategorie>-b, ženské týmy women. Sezóny starý věk přeloží na nový. Starý
//    unikátní index týmu { name, age } se maže PŘED převodem: po `$unset age` by jinak dva
//    týmy stejného jména (AFK Bratčice muži a žáci) kolidovaly na `age: null`.
// 4) Založí nové indexy týmu a kategorie, aby nezáviselo na tom, jestli server nastartoval
//    před migrací, nebo po ní (TeamDao by unikátní index nad týmy bez kategorie nezaložil).
//
// Pouští se opakovaně: co už je převedené, přeskočí.
import "caio-server/src/caio-server-app/config/env.js";
import { MongoClient } from "mongodb";
import Config from "../server/config.js";

const DRY = process.argv.includes("--dry");

const CATEGORY_LIST = [
  { code: "men-a", name: "A (Muži)", age: "men" },
  { code: "men-b", name: "B (Muži)", age: "men" },
  { code: "men-c", name: "C (Muži)", age: "men" },
  { code: "u19", name: "U19 (Dorost - starší)", age: "u19" },
  { code: "u17", name: "U17 (Dorost - mladší)", age: "u17" },
  { code: "u15", name: "U15 (Žáci - starší)", age: "u15" },
  { code: "u15-b", name: "U15 B (Žáci - starší)", age: "u15" },
  { code: "u13", name: "U13 (Žáci - mladší)", age: "u13" },
  { code: "u11", name: "U11 (Přípravka - starší)", age: "u11" },
  { code: "u9", name: "U9 (Přípravka - mladší)", age: "u9" },
  { code: "women", name: "Ženy", age: "women" },
  { code: "old", name: "Stará garda", age: "old" },
];

// Starý věk -> nová věková skupina a výchozí kategorie.
const AGE_BY_OLD = { men: "men", u18: "u19", u16: "u17", u14: "u15", u12: "u13", u10: "u11", u6: "u9", old: "old" };
const CATEGORY_BY_OLD = { men: "men-a", u18: "u19", u16: "u17", u14: "u15", u12: "u13", u10: "u11", u6: "u9", old: "old" };
// Staré věky, které v novém světě nejsou -- podle nich se pozná neprevedená konfigurace.
// (`men` a `old` existují i jako nové hodnoty, takže samy nic neříkají.)
const OLD_ONLY = ["u18", "u16", "u14", "u12", "u10", "u6"];
const OLD_DEFAULT_ORDER = ["men", "u18", "u16", "u14", "u12", "u10", "u6", "old"];

/** Kategorie týmu podle starého věku a jména (design/data-model.md, 2.3). */
function categoryOf(team) {
  if (/\(ženy\)/i.test(team.name ?? "")) return "women";
  const base = CATEGORY_BY_OLD[team.age];
  if (!base) return null;
  const reserve = (team.name ?? "").match(/ ([BC])$/)?.[1]?.toLowerCase();
  if (!reserve || base === "old") return base;
  if (base === "men-a") return `men-${reserve}`;
  return `${base}-${reserve}`;
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set");
  process.exit(1);
}
const mongo = new MongoClient(uri);
await mongo.connect();
const db = mongo.db();
console.log(`Mongo: ${uri.replace(/\/\/.*@/, "//***@")}${DRY ? "  [DRY RUN]" : ""}\n`);

// --- 1. kategorie --------------------------------------------------------------------

const categoryCol = db.collection("afk_category");
let created = 0;
for (const category of CATEGORY_LIST) {
  if (await categoryCol.findOne({ code: category.code })) continue;
  created++;
  console.log(`  + ${category.code.padEnd(6)} ${category.name}`);
  if (!DRY) {
    const now = new Date().toISOString();
    await categoryCol.insertOne({ ...category, sys: { cts: now, mts: now } });
  }
}
if (!DRY) await categoryCol.createIndex({ code: 1 }, { unique: true });
console.log(`kategorie: ${created} nových, ${CATEGORY_LIST.length - created} už bylo\n`);

// --- 2. konfigurace ------------------------------------------------------------------

const configCol = db.collection("afk_config");
const config = await configCol.findOne({});
if (config) {
  const patch = {};
  const isOld = (list) => Array.isArray(list) && list.some((x) => OLD_ONLY.includes(x));
  if (isOld(config.hideNamesAgeList)) {
    patch.hideNamesAgeList = [...new Set(config.hideNamesAgeList.map((x) => AGE_BY_OLD[x] ?? x))];
  }
  const isOldOrder = (list) => Array.isArray(list) && (list.includes("men") || list.some((x) => OLD_ONLY.includes(x)));
  if (isOldOrder(config.categoryOrder)) {
    // Nezměněné staré výchozí pořadí -> nové výchozí (B/C týmy hned za áčkem). Upravené
    // pořadí se přeloží a chybějící kategorie jdou za něj.
    if (config.categoryOrder.join() === OLD_DEFAULT_ORDER.join()) {
      patch.categoryOrder = Config.DEFAULT_APP_CONFIG.categoryOrder;
    } else {
      const translated = config.categoryOrder.map((x) => CATEGORY_BY_OLD[x] ?? x);
      const rest = Config.DEFAULT_APP_CONFIG.categoryOrder.filter((code) => !translated.includes(code));
      patch.categoryOrder = [...new Set([...translated, ...rest])];
    }
  }
  if (Object.keys(patch).length) {
    console.log("konfigurace:", JSON.stringify(patch));
    if (!DRY) await configCol.updateOne({ _id: config._id }, { $set: { ...patch, "sys.mts": new Date().toISOString() } });
  } else {
    console.log("konfigurace: nic k převodu");
  }
} else {
  console.log("konfigurace: v databázi není, platí výchozí");
}

// --- 3. týmy a sezóny ----------------------------------------------------------------

const teamCol = db.collection("afk_team");

// Starý unikátní index { name, age } pryč dřív, než se `age` začne mazat (viz hlavička).
if (!DRY) {
  const indexList = await teamCol.indexes().catch(() => []);
  for (const index of indexList) {
    if (index.key && "age" in index.key) {
      await teamCol.dropIndex(index.name);
      console.log(`index afk_team.${index.name} smazán`);
    }
  }
}

const teams = await teamCol.find({ age: { $exists: true }, category: { $exists: false } }).toArray();
let converted = 0;
for (const team of teams) {
  const category = categoryOf(team);
  if (!category || !CATEGORY_LIST.some((c) => c.code === category)) {
    console.warn(`  tým ${team._id} (${team.name}, ${team.age}) -> neznámá kategorie "${category}", přeskakuji`);
    continue;
  }
  converted++;
  if (!DRY) await teamCol.updateOne({ _id: team._id }, { $set: { category }, $unset: { age: "" } });
}
console.log(`\ntýmy: ${converted} z ${teams.length} převedeno na kategorii`);

const seasonCol = db.collection("afk_season");
const seasons = await seasonCol.find({ age: { $in: OLD_ONLY } }).toArray();
for (const season of seasons) {
  if (!DRY) await seasonCol.updateOne({ _id: season._id }, { $set: { age: AGE_BY_OLD[season.age] } });
}
console.log(`sezóny: ${seasons.length} převedeno na novou věkovou skupinu`);

// --- 4. indexy -----------------------------------------------------------------------
// Stejné jako TeamDao/CategoryDao.createIndexes (server je zakládá při startu taky).
if (!DRY) {
  await teamCol.createIndex({ name: 1, category: 1 }, { unique: true });
  await teamCol.createIndex({ category: 1, name: 1 });
  await categoryCol.createIndex({ age: 1 });
  console.log("indexy afk_team a afk_category založeny");
}

await mongo.close();
console.log(DRY ? "\nDRY RUN -- nic se nezapsalo." : "\nHotovo.");
