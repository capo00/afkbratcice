import matchCrud from "../match/crud.js";
import playerCrud from "../player/crud.js";
import teamCrud from "../team/crud.js";
import seasonCrud from "../season/crud.js";
import articleCrud from "../article/crud.js";
import galleryCrud from "../gallery/crud.js";
import { ROUTE_SEO, pageTitle, seasonName } from "./route-seo.js";

// Hlavička dokumentu podle stránky (caio-server `App.init({ seo: { document } })`, review
// 2026-11-12, Top 10 #7). Facebook ani WhatsApp nespouští JavaScript, takže titulek, popis
// a obrázek, které nastaví klient (`usePageTitle`), do náhledu sdíleného odkazu nedojdou --
// píše je proto server. Neexistující stránka dostane 404 (tělo zůstává aplikace, ta ukáže
// svoje „nenalezeno“).
//
// Data se berou **přes crud s anonymní identitou**, tedy se stejnými pravidly jako veřejné
// API: dítě se skrytým jménem nemá jméno ani fotku (services/hidden-names.js), nepublikovaný
// článek a album jsou 404.

// Obrázek, když stránka žádný nemá. Cesta, ne adresa: caio-server ji doplní adresou, na kterou
// přišel požadavek (build ji má z `APP_URL`, a ten do přepnutí DNS vede na starý web -- 404).
// Rozměry zná jen u něj (1200 × 630, `public/assets/meta/`); u fotek z dat je caio-server vynechá.
const DEFAULT_IMAGE = "/assets/meta/og-image.jpg";
const DEFAULT_IMAGE_SIZE = { imageWidth: 1200, imageHeight: 630 };
const NOT_FOUND = {
  status: 404,
  title: pageTitle("Stránka nenalezena"),
  description: null,
  image: DEFAULT_IMAGE,
  ...DEFAULT_IMAGE_SIZE,
  noindex: true,
};
const ID = /^[0-9a-f]{24}$/i;

const TEAM_ROUTE_LIST = ["muzstvo", "muzstvo/zapasy", "muzstvo/tabulka", "muzstvo/statistiky"];

/** Načtení dat stránky; v testech se podstrčí jiné. `null` = neexistuje. */
const defaultLoaders = {
  match: (id) => matchCrud.get(id, null),
  player: (id) => playerCrud.get(id, null),
  team: (id) => teamCrud.get(id),
  currentCategoryList: () => seasonCrud.listCurrent(),
  season: (id) => seasonCrud.get(id),
  article: (id) => articleCrud.get(id, null),
  gallery: (id) => galleryCrud.get(id, null),
};

/** Záznam, nebo `null` pro neplatné id a 404. Jiná chyba (výpadek DB) letí dál -- caio-server
 * pak pošle dokument beze změny, místo aby existující stránku ohlásil jako neexistující. */
async function load(loader, id) {
  if (!id || !ID.test(String(id))) return null;
  try {
    return (await loader(String(id))) ?? null;
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

// „Jan Novák“ -- jako `personName` v `client/src/core/person-name.js`.
const personName = (person) => [person?.name, person?.surname].filter(Boolean).join(" ");

/** „12. 10. 2026“ v českém čase -- server běží v UTC, zápas ve 23:30 by jinak spadl na další den. */
function czDate(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("cs-CZ", { timeZone: "Europe/Prague" })
    : null;
}

const page = (title, description, image) => ({
  title: pageTitle(title),
  description,
  ...(image ? { image } : { image: DEFAULT_IMAGE, ...DEFAULT_IMAGE_SIZE }),
});

/** Meta stránky z dat. Vrací `{ status?, title, description, image, noindex? }`. */
async function resolvePage(route, query, loaders) {
  const fallback = ROUTE_SEO[route];
  if (!fallback) return NOT_FOUND;

  const id = query?.id;

  if (route === "zapas") {
    const match = await load(loaders.match, id);
    if (!match) return NOT_FOUND;
    const pair = `${match.homeTeam?.name ?? "?"} – ${match.guestTeam?.name ?? "?"}`;
    const score = Number.isFinite(match.homeGoals) && Number.isFinite(match.guestGoals) ? ` ${match.homeGoals}:${match.guestGoals}` : "";
    const season = match.seasonId ? await load(loaders.season, match.seasonId) : null;
    const detail = [match.round ? `${match.round}. kolo` : null, season ? seasonName(season) : null, czDate(match.time)].filter(Boolean);
    return page(pair + score, `${detail.length ? `${detail.join(", ")}. ` : ""}Sestava a střelci.`);
  }

  if (route === "hrac") {
    const player = await load(loaders.player, id);
    if (!player) return NOT_FOUND;
    const name = personName(player.person);
    // Dítě se skrytým jménem: titulek routy, žádná fotka, do vyhledávání ne (jako klient).
    if (!name) return { ...page(fallback.title, fallback.description), noindex: true };
    return page(name, `${name} – profil a statistiky hráče AFK Bratčice.`, player.person?.photoUri);
  }

  if (TEAM_ROUTE_LIST.includes(route)) {
    const team = await load(loaders.team, id);
    if (!team) return NOT_FOUND;
    const category = (await loaders.currentCategoryList().catch(() => [])).find((item) => item.teamId === team.id);
    const label = category?.categoryName ?? team.name;
    const description = category?.competition ? `${label} AFK Bratčice – ${category.competition}.` : fallback.description;
    return page(`${label} – ${fallback.title}`, description, team.photoUri);
  }

  if (route === "sezona") {
    const season = await load(loaders.season, id);
    if (!season) return NOT_FOUND;
    return page(seasonName(season), `Tabulka a všechna kola soutěže ${seasonName(season)}.`);
  }

  if (route === "novinka") {
    const article = await load(loaders.article, id);
    if (!article) return NOT_FOUND;
    return page(article.name, article.desc || fallback.description, article.photographUri);
  }

  if (route === "fotogalerie/album") {
    const gallery = await load(loaders.gallery, id);
    if (!gallery) return NOT_FOUND;
    return page(gallery.name, gallery.desc || fallback.description, gallery.coverThumbUri);
  }

  return page(fallback.title, fallback.description);
}

/**
 * Háček pro caio-server: `{ req, path }` -> meta stránky. `path` je bez jazykové předpony
 * (web má jen češtinu) a bez koncového lomítka (caio-server ho přesměruje dřív).
 */
function createDocumentHook(loaders = defaultLoaders) {
  return ({ req, path }) => resolvePage(String(path ?? "/").replace(/^\/+|\/+$/g, ""), req?.query, loaders);
}

const document = createDocumentHook();

export { document, createDocumentHook, resolvePage, DEFAULT_IMAGE, DEFAULT_IMAGE_SIZE, NOT_FOUND };
export default document;
