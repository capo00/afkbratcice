// Titulky a popisy stránek pro vyhledávače a náhledy sdílení (Caio 2026-10-29, vzor
// z caio_propertyman `config/seo.js`).
//
// Bez uu5 importů schválně: čte ho i `client/vite.config.js` při buildu (statický popis
// a `og:*` v index.html pro roboty, kteří nespouštějí JS -- Facebook, WhatsApp, Seznam)
// a jeho test v node. Zápis do `<head>` za běhu dělá `tools/page-meta.js`.
//
// Stránky s daty (mužstvo, zápas, hráč, novinka, album, kolo) mají tady jen výchozí
// titulek; konkrétní („A (Muži) – Soupiska", „AFK Bratčice – Chotusice") si doplní samy
// přes `usePageTitle`, až data dorazí.
import { PAGES } from "../content/pages.js";

const SITE_NAME = "AFK Bratčice";
const OG_LOCALE = "cs_CZ";

const HOME_DESCRIPTION =
  "Fotbalový klub AFK Bratčice od roku 1932 – program zápasů, výsledky, tabulky a soupisky mužů, mládeže i staré gardy.";

// Klíč = routa z `router.jsx` (shodu hlídá seo.test.js). `title: null` = jen název klubu.
const ROUTE_SEO = {
  "": { title: null, description: HOME_DESCRIPTION },
  novinky: { title: "Novinky", description: "Novinky a reportáže ze zápasů AFK Bratčice." },
  novinka: { title: "Novinka", description: "Novinky a reportáže ze zápasů AFK Bratčice." },
  muzstva: { title: "Mužstva", description: "Mužstva AFK Bratčice – muži, dorost, žáci a stará garda." },
  muzstvo: { title: "Soupiska", description: "Soupiska a realizační tým mužstva AFK Bratčice." },
  "muzstvo/zapasy": { title: "Zápasy", description: "Program a výsledky zápasů mužstva AFK Bratčice." },
  "muzstvo/tabulka": { title: "Tabulka", description: "Tabulka soutěže, ve které hraje mužstvo AFK Bratčice." },
  "muzstvo/statistiky": { title: "Statistiky", description: "Střelci, starty a karty hráčů mužstva AFK Bratčice." },
  zapas: { title: "Zápas", description: "Výsledek, sestava a střelci zápasu AFK Bratčice." },
  kolo: { title: "Kolo", description: "Všechny zápasy kola soutěže, ve které hraje AFK Bratčice." },
  hrac: { title: "Hráč", description: "Profil a statistiky hráče AFK Bratčice." },
  fotogalerie: { title: "Fotogalerie", description: "Fotografie ze zápasů a života klubu AFK Bratčice." },
  "fotogalerie/album": { title: "Album", description: "Fotografie ze zápasů a života klubu AFK Bratčice." },
  kontakt: { title: "Kontakt", description: "Kde najdete hřiště AFK Bratčice a jak nás kontaktovat." },
  ...Object.fromEntries(Object.entries(PAGES).map(([code, page]) => [code, { title: page.name, description: page.desc }])),
};

/** „Soupiska · AFK Bratčice", bez jména stránky jen název klubu. */
function pageTitle(name) {
  return name ? `${name} · ${SITE_NAME}` : SITE_NAME;
}

/** Výchozí meta stránky; neznámá routa (404) dostane `noindex`. */
function getRouteSeo(uu5Route) {
  const entry = ROUTE_SEO[uu5Route ?? ""];
  if (!entry) return { title: "Stránka nenalezena", description: null, noindex: true };
  return { ...entry, noindex: false };
}

export { SITE_NAME, OG_LOCALE, HOME_DESCRIPTION, ROUTE_SEO, pageTitle, getRouteSeo };
