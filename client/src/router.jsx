import { useRouter, useRoute, Suspense, Utils } from "uu5g05";
import { PAGE_CODE_LIST } from "./content/pages.js";
import PageLoading from "./components/layout/page-loading.jsx";

// Routy se načítají **lazy**: kdo přijde na home, nemá stahovat kód statistik.
// Administrace tu není vůbec — je to vlastní UVE (admin/app.jsx, /admin/).
// `Utils.Component.lazy` je uu5 obálka nad `React.lazy`.
const Home = Utils.Component.lazy(() => import("./routes/home.jsx"));
const Teams = Utils.Component.lazy(() => import("./routes/teams.jsx"));
const Team = Utils.Component.lazy(() => import("./routes/team.jsx"));
const TeamMatches = Utils.Component.lazy(() => import("./routes/team-matches.jsx"));
const TeamTable = Utils.Component.lazy(() => import("./routes/team-table.jsx"));
const TeamStats = Utils.Component.lazy(() => import("./routes/team-stats.jsx"));
const Match = Utils.Component.lazy(() => import("./routes/match.jsx"));
const Season = Utils.Component.lazy(() => import("./routes/season.jsx"));
const Player = Utils.Component.lazy(() => import("./routes/player.jsx"));
const Page = Utils.Component.lazy(() => import("./routes/page.jsx"));
const Kontakt = Utils.Component.lazy(() => import("./routes/kontakt.jsx"));
const NotFound = Utils.Component.lazy(() => import("./routes/not-found.jsx"));
const Zajimavosti = Utils.Component.lazy(() => import("./routes/zajimavosti.jsx"));

// uu5g05 routeMap: klíč = cesta, hodnota = element / { redirect } / { rewrite }.
//
// **Adresy jsou české** (rozhodnuto 2026-09-06). Je to web českého klubu — a hlavně jsou
// tím shodné s v0, takže `/muzstva`, `/historie`, `/hymna` a `/vybor`
// sedí bez jediného přesměrování a co je naindexované ve
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

  // Novinky (`novinky`, `novinka`) na webu nebudou (Caio 2026-11-19); články zůstávají jen
  // v administraci. Staré adresy `/novinka-<n>` a `/home-<n>` vede server na úvod.

  muzstva: <Teams />,
  muzstvo: <Team />,
  "muzstvo/zapasy": <TeamMatches />,
  "muzstvo/tabulka": <TeamTable />,
  "muzstvo/statistiky": <TeamStats />,

  zapas: <Match />,
  // Detail sezóny: tabulka a všechna kola. Nahradil stránku `kolo` (jedno kolo), 2026-11.
  sezona: <Season />,
  hrac: <Player />,

  // Fotogalerie na webu zatím není (Caio 2026-11-19), `/fotogalerie` server dočasně (302)
  // posílá na úvod. Obrazovky `routes/gallery.jsx` a `routes/gallery-detail.jsx` zůstávají:
  // návrat jsou dva lazy importy, dva řádky tady, záznamy v `config/seo.js`
  // a `server/seo/route-seo.js` a pravidlo v `server/legacy-redirect.js`.

  kontakt: <Kontakt />,
  // Klub → Zajímavosti, po kategoriích (`?kategorie=men-a`).
  zajimavosti: <Zajimavosti />,
  // Obsahové stránky sdílí jednu obrazovku a rozlišuje je routa; seznam je zdroj pravdy
  // v `content/pages.js`, aby se nová stránka přidávala na jednom místě.
  ...Object.fromEntries(PAGE_CODE_LIST.map((code) => [code, <Page />])),

  "*": <NotFound />,
};

const FALLBACK = <PageLoading />;

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
