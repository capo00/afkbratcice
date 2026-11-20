import migrationMapDao from "./migration-map/dao.js";
import teamDao from "./team/dao.js";

// Přesměrování URL ze starého PHP webu (v0). Musí být namountované PŘED SPA fallbackem,
// jinak by cesty bez přípony spolkl index.html.
//
// Statická pravidla a od 2026-10-28 i adresy s číselným id z v0: zápas a mužstvo přes
// `afk_migration_map` (plní ji tools/migrate-v0.js), stránky mužstev podle kategorie.
// Co se v mapě nenajde, skončí na nejbližším seznamu, ne na 404.
//
// Od 2026-11-20 i přímé adresy `*.php` (v0 je obsluhoval vedle hezkých, takže mohou být
// zaindexované): převedou se na hezkou adresu v0 a projdou stejnými pravidly, bez dvojího
// přesměrování (`PHP_PAGE`).
//
// **Administrace v0 nikam nevede** (Caio 2026-11-20): nová administrace má zůstat robotům
// skrytá, takže na ni žádná stará adresa nepřesměrovává -- úpravy, mazání, profil i přihlášení
// v0 vracejí 410 (`V0_ADMIN`), resp. vedou na úvod (`/prihlaseni`).

// Routy nové appky jsou **české a shodné s v0** (`/historie`, `/hymna`, `/vybor`,
// `/muzstva`), takže se pro ně žádné pravidlo nepíše — adresa zůstává platná a SPA fallback ji
// obslouží sám. Zbývá jen to, kde se adresa opravdu liší.
const STATIC_REDIRECT = {
  "/home": "/",
  // v0 má podtržítko, nová routa pomlčku.
  "/tymove_fotky": "/tymove-fotky",
  // Přihlášení ze v0 vedlo do administrace (2026-11-10); od 2026-11-20 na úvod, aby stará
  // zaindexovaná adresa nevodila roboty do administrace. Člověk se přihlásí ikonou v liště.
  "/prihlaseni": "/",
  "/zapomenute-heslo": "/login.html",
  // Stránka tréninků zrušena 2026-11-04 (client/src/content/pages.js).
  "/treninky": "/",
  // Výpis zápasu bez čísla nic nezobrazoval.
  "/informace-o-zapase": "/muzstva",
  "/chyba": "/",
};

// Novinky ani fotogalerie na webu nejsou (Caio 2026-11-19): stránkování novinek v0
// (`/home-2`, `/home-69`, ...), článek (`/novinka-<n>`) i album (`/fotogalerie-<n>`) vedou
// natrvalo na úvod. Výpis fotogalerie dočasně (`NOT_YET`), ten se vrátí.
const HOME_PAGE = /^\/home-\d+$/;
const ARTICLE_PAGE = /^\/novinka-\d+$/;
const GALLERY_PAGE = /^\/fotogalerie-\d+$/;

// Zápas s id z v0 -> detail přes `afk_migration_map`.
const MATCH_PAGE = /^\/informace-o-zapase-(\d+)$/;
// Zápasy mužstva: `/zapasy` jsou muži, `/zapasy-<id týmu v0>` ostatní mužstva.
const TEAM_MATCHES_PAGE = /^\/zapasy(?:-(\d+))?$/;

// Stránky mužstev, tabulek a výpisů všech zápasů z v0 -> vlastní mužstvo podle kategorie.
const TEAM_PAGE = {
  "/muzi": ["men-a", "muzstvo"],
  "/zaci": ["u15", "muzstvo"],
  "/dorost": ["u19", "muzstvo"],
  "/stara-garda": ["old", "muzstvo"],
  "/tabulka-muzi": ["men-a", "muzstvo/tabulka"],
  "/tabulka-zaci": ["u15", "muzstvo/tabulka"],
  "/tabulka-dorost": ["u19", "muzstvo/tabulka"],
  "/vsechny-zapasy-muzi": ["men-a", "muzstvo/zapasy"],
  "/vsechny-zapasy-zaci": ["u15", "muzstvo/zapasy"],
  "/vsechny-zapasy-dorost": ["u19", "muzstvo/zapasy"],
};

// Stránky, které v0 měla a web zatím ne (todo.md, 2): dočasně na úvod, ne natrvalo.
const NOT_YET = { "/ke-stazeni": "/", "/fotogalerie": "/" };

// Klubová kasa, staré JSON API a RSS novinek (novinky na webu nejsou) jsou mimo rozsah --
// 410 říká vyhledávačům i čtečkám, že se nevrátí, na rozdíl od 404. Obrázky a galerie v0
// (`/obrazky/…`, `/galerie/…`) mohou být v obrázkovém vyhledávání.
const GONE = [
  /^\/pokladna/,
  /^\/pokuty/,
  /^\/moje-pokuty/,
  /^\/prijem/,
  /^\/vydaj/,
  /^\/api\//,
  /^\/rss$/,
  /^\/obrazky\//,
  /^\/galerie\//,
];

// Administrace v0 (`.htaccess`): profil, editace, úpravy, mazání, kasa. 410, nikam nevede.
const V0_ADMIN = /^\/(profil|editace-|upravit-|uprava-zapasu|novy-|nova-|smazat-|pridat-pokutu|zaplatit-|obnovit-pokutu|zablokovani-)/;

// Diskuze se ruší (poslední příspěvek 2017, zaspamovaná).
const DISCUSSION = /^\/diskuze/;

/**
 * Přímé adresy PHP souborů v0 -> hezká adresa v0, kterou pak řeší pravidla výš (podle
 * `RewriteRule` v `.htaccess` v0). `null` = administrace nebo pomocný soubor v0: 410.
 */
const PHP_PAGE = {
  index: () => "/",
  uvodniPhp: () => "/",
  chyba: () => "/",
  historie: () => "/historie",
  hymna: () => "/hymna",
  vybor: () => "/vybor",
  kontakt: () => "/kontakt",
  tymove_fotky: () => "/tymove-fotky",
  treninky: () => "/treninky",
  keStazeni: () => "/ke-stazeni",
  diskuze: () => "/diskuze",
  rss: () => "/rss",
  pokladna: () => "/pokladna",
  pokuty: () => "/pokuty",
  dluh: () => "/moje-pokuty",
  prijem: () => "/prijem",
  vydaj: () => "/vydaj",
  infoZapasu: (q) => (q.zapas ? `/informace-o-zapase-${q.zapas}` : "/informace-o-zapase"),
  novinka: () => "/novinka-0",
  fotogalerie: (q) => (q.id ? `/fotogalerie-${q.id}` : "/fotogalerie"),
  zapasy: (q) => (q.id ? `/zapasy-${q.id}` : "/zapasy"),
  tym: (q) => ({ d: "/dorost", z: "/zaci", s: "/stara-garda" })[q.vek] ?? "/muzi",
  tabulka: (q) => ({ d: "/tabulka-dorost", z: "/tabulka-zaci" })[q.vek] ?? "/tabulka-muzi",
  vsechnyZapasy: (q) => ({ d: "/vsechny-zapasy-dorost", z: "/vsechny-zapasy-zaci" })[q.vek] ?? "/vsechny-zapasy-muzi",
};
const PHP_FILE = /^\/([A-Za-z_]+)\.php$/;

async function ownTeamId(category) {
  const [team] = await teamDao.listByFilter({ categoryList: [category], own: true });
  return team?.id ?? null;
}

async function idRedirect(path) {
  const match = path.match(MATCH_PAGE);
  if (match) {
    const id = await migrationMapDao.findTargetId("match", match[1]);
    return id ? `/zapas?id=${id}` : "/muzstva";
  }

  const teamMatches = path.match(TEAM_MATCHES_PAGE);
  if (teamMatches) {
    const id = teamMatches[1] ? await migrationMapDao.findTargetId("team", teamMatches[1]) : await ownTeamId("men-a");
    return id ? `/muzstvo/zapasy?id=${id}` : "/muzstva";
  }

  const teamPage = TEAM_PAGE[path];
  if (teamPage) {
    const id = await ownTeamId(teamPage[0]);
    return id ? `/${teamPage[1]}?id=${id}` : "/muzstva";
  }

  return null;
}

/**
 * Co udělat se starou adresou v0: `{ status: 301|302, location }`, `{ status: 410 }`, nebo `null`
 * (adresa je platná i v nové appce, nebo neznámá -- odpoví SPA). `query` jen pro `*.php`.
 */
export async function resolveLegacy(path, query = {}) {
  const php = path.match(PHP_FILE);
  if (php) {
    const toV0 = PHP_PAGE[php[1]];
    if (!toV0) return { status: 410 };
    const v0Path = toV0(query);
    // Hezká adresa v0, kterou nová appka obslouží beze změny (`/historie`), je cílem sama.
    return (await resolveLegacy(v0Path)) ?? { status: 301, location: v0Path };
  }

  if (path === "/") return null;

  const target = STATIC_REDIRECT[path];
  if (target) return { status: 301, location: target };

  if (HOME_PAGE.test(path) || ARTICLE_PAGE.test(path) || GALLERY_PAGE.test(path) || DISCUSSION.test(path)) {
    return { status: 301, location: "/" };
  }
  if (V0_ADMIN.test(path) || GONE.some((re) => re.test(path))) return { status: 410 };
  if (NOT_YET[path]) return { status: 302, location: NOT_YET[path] };

  const idTarget = await idRedirect(path);
  return idTarget ? { status: 301, location: idTarget } : null;
}

async function legacyRedirect(req, res, next) {
  const path = req.path.replace(/\/+$/, "") || "/";
  try {
    const result = await resolveLegacy(path, req.query);
    if (!result) return next();
    if (result.status === 410) return res.status(410).send("410 Gone");
    return res.redirect(result.status, result.location);
  } catch (e) {
    return next(e);
  }
}

export default legacyRedirect;
