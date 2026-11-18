// Titulky a popisy rout pro hlavičku dokumentu, kterou posílá server (seo/document.js).
//
// Kopie `ROUTE_SEO` z klienta (`client/src/config/seo.js`): klientské zdrojáky se nenasazují
// (`.gcloudignore`), takže je server naimportovat nemůže. Shodu hlídá `client/src/config/seo-server.test.js` (server nesmí importovat z `client/`, opačně to jde)
// -- změna titulku v klientu bez změny tady test shodí.

const SITE_NAME = "AFK Bratčice";

const HOME_DESCRIPTION =
  "Fotbalový klub AFK Bratčice od roku 1932 – program zápasů, výsledky, tabulky a soupisky mužů, mládeže i staré gardy.";

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
  sezona: { title: "Sezóna", description: "Tabulka a všechna kola soutěže, ve které hraje AFK Bratčice." },
  hrac: { title: "Hráč", description: "Profil a statistiky hráče AFK Bratčice." },
  fotogalerie: { title: "Fotogalerie", description: "Fotografie ze zápasů a života klubu AFK Bratčice." },
  "fotogalerie/album": { title: "Album", description: "Fotografie ze zápasů a života klubu AFK Bratčice." },
  kontakt: { title: "Kontakt", description: "Kde najdete hřiště AFK Bratčice a jak nás kontaktovat." },
  zajimavosti: { title: "Zajímavosti", description: "Rekordy, série a nejlepší hráči AFK Bratčice za celou historii." },
  historie: { title: "Historie klubu", description: "Fotbal v Bratčicích od roku 1932 po dnešek." },
  hymna: { title: "Hymna", description: "Klubová hymna Traverza." },
  vybor: { title: "Výbor AFK", description: "Lidé, kteří klub vedou." },
  "tymove-fotky": { title: "Týmové fotky", description: "Mužstva AFK Bratčice od roku 1943." },
};

/** „Soupiska · AFK Bratčice“, bez jména stránky jen název klubu (jako klient, caio-ui `usePageMeta`). */
function pageTitle(name) {
  return name ? `${name} · ${SITE_NAME}` : SITE_NAME;
}

/** „2025/26“ -- jako `seasonYears` v `client/src/core/season-label.js`. */
function seasonYears(season) {
  const from = Number(season?.yearFrom);
  if (!season?.yearFrom || !Number.isFinite(from)) return season?.yearFrom ?? "—";
  return `${from}/${String((from + 1) % 100).padStart(2, "0")}`;
}

/** „III. třída 2025/26“ -- jako `seasonName` v klientu. */
function seasonName(season) {
  return [season?.competition, seasonYears(season)].filter(Boolean).join(" ");
}

export { SITE_NAME, HOME_DESCRIPTION, ROUTE_SEO, pageTitle, seasonYears, seasonName };
