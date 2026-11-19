import migrationMapDao from "./migration-map/dao.js";
import teamDao from "./team/dao.js";

// Přesměrování URL ze starého PHP webu (v0). Musí být namountované PŘED SPA fallbackem,
// jinak by cesty bez přípony spolkl index.html.
//
// Statická pravidla a od 2026-10-28 i adresy s číselným id z v0: zápas a mužstvo přes
// `afk_migration_map` (plní ji tools/migrate-v0.js), stránky mužstev podle kategorie.
// Co se v mapě nenajde, skončí na nejbližším seznamu, ne na 404.

// Routy nové appky jsou **české a shodné s v0** (`/historie`, `/hymna`, `/vybor`,
// `/muzstva`), takže se pro ně žádné pravidlo nepíše — adresa zůstává platná a SPA fallback ji obslouží sám. Zbývá jen to, kde se
// adresa opravdu liší.
const STATIC_REDIRECT = {
  "/home": "/",
  // v0 má podtržítko, nová routa pomlčku.
  "/tymove_fotky": "/tymove-fotky",
  // Přihlášení ze v0 vede do administrace: web přihlášení v liště nemá a administrace
  // nepřihlášenému nabídne přihlášení sama (guard). Po něm zapíše značku, podle které web
  // ukáže odkaz do správy (client/src/tools/admin-hint.js).
  "/prihlaseni": "/admin/",
  "/zapomenute-heslo": "/login.html",
  // Stránka tréninků zrušena 2026-11-04 (client/src/content/pages.js).
  "/treninky": "/",
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

// Stránky mužstev a tabulek z v0 -> vlastní mužstvo podle kategorie.
const TEAM_PAGE = {
  "/muzi": ["men-a", "muzstvo"],
  "/zaci": ["u15", "muzstvo"],
  "/dorost": ["u19", "muzstvo"],
  "/stara-garda": ["old", "muzstvo"],
  "/tabulka-muzi": ["men-a", "muzstvo/tabulka"],
  "/tabulka-zaci": ["u15", "muzstvo/tabulka"],
  "/tabulka-dorost": ["u19", "muzstvo/tabulka"],
};

// Stránky, které v0 měla a web zatím ne (todo.md, 2): dočasně na úvod, ne natrvalo.
const NOT_YET = { "/ke-stazeni": "/", "/fotogalerie": "/" };

async function ownTeamId(category) {
  const [team] = await teamDao.listByFilter({ categoryList: [category], own: true });
  return team?.id ?? null;
}

// Klubová kasa, staré JSON API a RSS novinek (novinky na webu nejsou) jsou mimo rozsah --
// 410 říká vyhledávačům i čtečkám, že se nevrátí, na rozdíl od 404.
const GONE = [/^\/pokladna/, /^\/pokuty/, /^\/moje-pokuty/, /^\/prijem/, /^\/vydaj/, /^\/api\//, /^\/rss$/];

// Diskuze se ruší (poslední příspěvek 2017, zaspamovaná).
const DISCUSSION = /^\/diskuze/;

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

async function legacyRedirect(req, res, next) {
  const path = req.path.replace(/\/+$/, "") || "/";

  if (path === "/") return next();

  const target = STATIC_REDIRECT[path];
  if (target) return res.redirect(301, target);

  if (HOME_PAGE.test(path) || ARTICLE_PAGE.test(path) || GALLERY_PAGE.test(path)) return res.redirect(301, "/");

  if (DISCUSSION.test(path)) return res.redirect(301, "/");
  if (GONE.some((re) => re.test(path))) return res.status(410).send("410 Gone");
  if (NOT_YET[path]) return res.redirect(302, NOT_YET[path]);

  try {
    const idTarget = await idRedirect(path);
    if (idTarget) return res.redirect(301, idTarget);
  } catch (e) {
    return next(e);
  }

  return next();
}

export default legacyRedirect;
