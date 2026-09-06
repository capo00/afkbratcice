import { useRouter, useRoute, Suspense, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { PAGE_CODE_LIST } from "./content/pages.js";

// Routy se načítají **lazy**: kdo přijde na home, nemá stahovat kód fotogalerie ani
// administrace. `Utils.Component.lazy` je uu5 obálka nad `React.lazy`.
const Home = Utils.Component.lazy(() => import("./routes/home.jsx"));
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
