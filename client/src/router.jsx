import { useRouter, useRoute, Suspense, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp } from "caio-ui";
import Config from "./config/config.js";
import { PAGE_CODE_LIST } from "./content/pages.js";
import { ADMIN_MENU, ANY_ADMIN_PROFILE } from "./admin/menu.js";

// Routy se načítají **lazy**: kdo přijde na home, nemá stahovat kód fotogalerie ani
// administrace. `Utils.Component.lazy` je uu5 obálka nad `React.lazy`.
const Home = Utils.Component.lazy(() => import("./routes/home.jsx"));
const Novinky = Utils.Component.lazy(() => import("./routes/novinky.jsx"));
const Novinka = Utils.Component.lazy(() => import("./routes/novinka.jsx"));
const Teams = Utils.Component.lazy(() => import("./routes/teams.jsx"));
const Team = Utils.Component.lazy(() => import("./routes/team.jsx"));
const TeamMatches = Utils.Component.lazy(() => import("./routes/team-matches.jsx"));
const TeamTable = Utils.Component.lazy(() => import("./routes/team-table.jsx"));
const TeamStats = Utils.Component.lazy(() => import("./routes/team-stats.jsx"));
const Match = Utils.Component.lazy(() => import("./routes/match.jsx"));
const Round = Utils.Component.lazy(() => import("./routes/round.jsx"));
const Player = Utils.Component.lazy(() => import("./routes/player.jsx"));
const Gallery = Utils.Component.lazy(() => import("./routes/gallery.jsx"));
const GalleryDetail = Utils.Component.lazy(() => import("./routes/gallery-detail.jsx"));
const Page = Utils.Component.lazy(() => import("./routes/page.jsx"));
const Kontakt = Utils.Component.lazy(() => import("./routes/kontakt.jsx"));
const NotFound = Utils.Component.lazy(() => import("./routes/not-found.jsx"));

// Administrace se načítá stejně lazy jako zbytek — s tím rozdílem, že u ní je to i otázka
// objemu: tabulky `uu5tilesg02` a formuláře jsou největší kus kódu v appce a čtenář, který
// přišel na výsledek zápasu, je nemá stahovat vůbec.
const ADMIN_SCREEN = {
  "": Utils.Component.lazy(() => import("./routes/admin/index.jsx")),
  clubs: Utils.Component.lazy(() => import("./routes/admin/clubs.jsx")),
  teams: Utils.Component.lazy(() => import("./routes/admin/teams.jsx")),
  seasons: Utils.Component.lazy(() => import("./routes/admin/seasons.jsx")),
  matches: Utils.Component.lazy(() => import("./routes/admin/matches.jsx")),
  persons: Utils.Component.lazy(() => import("./routes/admin/persons.jsx")),
  players: Utils.Component.lazy(() => import("./routes/admin/players.jsx")),
  coaches: Utils.Component.lazy(() => import("./routes/admin/coaches.jsx")),
  articles: Utils.Component.lazy(() => import("./routes/admin/articles.jsx")),
  galleries: Utils.Component.lazy(() => import("./routes/admin/galleries.jsx")),
  files: Utils.Component.lazy(() => import("./routes/admin/files.jsx")),
  identities: Utils.Component.lazy(() => import("./routes/admin/identities.jsx")),
  config: Utils.Component.lazy(() => import("./routes/admin/config.jsx")),
};

/**
 * Routy administrace i s guardem.
 *
 * `withRoute` je **UX, ne bezpečnostní hranice** — rozhoduje server. Kdo na obrazovku nemá,
 * uvidí `Unauthorized`, ne zašedlou tabulku (design/frontend.md, 2.2). Množiny rolí drží
 * `admin/menu.js`, aby se rozcestník a guard nemohly rozejít.
 */
function adminRoutes() {
  const AdminIndex = UiApp.withRoute(ADMIN_SCREEN[""], { profileList: ANY_ADMIN_PROFILE });
  const routeMap = { admin: <AdminIndex /> };

  for (const item of ADMIN_MENU) {
    const code = item.route.replace("admin/", "");
    const Screen = ADMIN_SCREEN[code];
    // Obrazovka, která ještě není napsaná, se **nezaregistruje** — lepší 404 než položka
    // v rozcestníku, která vede na prázdno.
    if (!Screen) continue;
    const Guarded = UiApp.withRoute(Screen, { profileList: item.profileList });
    routeMap[item.route] = <Guarded />;
  }

  return routeMap;
}

// uu5g05 routeMap: klíč = cesta, hodnota = element / { redirect } / { rewrite }.
//
// **Adresy jsou české** (rozhodnuto 2026-09-06). Je to web českého klubu — a hlavně jsou
// tím shodné s v0, takže `/muzstva`, `/fotogalerie`, `/historie`, `/hymna`, `/vybor`,
// `/treninky` i `/ke-stazeni` sedí bez jediného přesměrování a co je naindexované ve
// vyhledávači, zůstane platné.
//
// Kanonická adresa úvodní stránky je **`/`, ne `/home`**: `server/legacy-redirect.js` posílá
// `/home` (adresa z v0) natrvalo na `/`, takže kdyby klient renderoval home na `home`, každé
// obnovení stránky by prošlo přesměrováním tam a zpátky.
//
// Routy mužstva jsou **klíčované `teamId` v parametru**, ne kategorií: `muzstvo?id=<teamId>`
// přežije i to, že kategorie letos není — jen se dostane do archivního režimu.
const ROUTE_MAP = {
  "": <Home />,
  home: { redirect: "" },

  // `/home-<n>` ze starého webu přesměrovává server sem s `pageIndex`, takže stránkování
  // novinek musí být v adrese, ne ve stavu obrazovky.
  novinky: <Novinky />,
  novinka: <Novinka />,

  muzstva: <Teams />,
  muzstvo: <Team />,
  "muzstvo/zapasy": <TeamMatches />,
  "muzstvo/tabulka": <TeamTable />,
  "muzstvo/statistiky": <TeamStats />,

  zapas: <Match />,
  kolo: <Round />,
  hrac: <Player />,

  fotogalerie: <Gallery />,
  "fotogalerie/album": <GalleryDetail />,

  kontakt: <Kontakt />,
  // Obsahové stránky sdílí jednu obrazovku a rozlišuje je routa; seznam je zdroj pravdy
  // v `content/pages.js`, aby se nová stránka přidávala na jednom místě.
  ...Object.fromEntries(PAGE_CODE_LIST.map((code) => [code, <Page />])),

  ...adminRoutes(),

  "*": <NotFound />,
};

const FALLBACK = (
  <div className={Config.Css.css({ display: "flex", justifyContent: "center", padding: 96 })}>
    <Uu5Elements.Pending size="xl" />
  </div>
);

function Router() {
  const element = useRouter(ROUTE_MAP);
  const [route] = useRoute();

  // ErrorBoundary dodává `UiApp.Spa`; tady stačí Suspense pro lazy chunk. `key` odvozený
  // z routy hranici po přechodu jinam resetuje — jinak by chyba na jedné obrazovce zůstala
  // viset i po odkliknutí pryč.
  return (
    <Suspense fallback={FALLBACK} key={route?.uu5Route}>
      {element}
    </Suspense>
  );
}

export default Router;
