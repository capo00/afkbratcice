import { useRouter, useRoute, Suspense, Utils } from "uu5g05";
import Config from "./config/config.js";
import { PAGE_CODE_LIST } from "./content/pages.js";
import PageLoading from "./components/layout/page-loading.jsx";
import Home from "./routes/home.jsx";
import Teams from "./routes/teams.jsx";
import Team from "./routes/team.jsx";
import TeamMatches from "./routes/team-matches.jsx";
import TeamTable from "./routes/team-table.jsx";
import TeamStats from "./routes/team-stats.jsx";
import Match from "./routes/match.jsx";
import Season from "./routes/season.jsx";
import Player from "./routes/player.jsx";
import Kontakt from "./routes/kontakt.jsx";
import NotFound from "./routes/not-found.jsx";
import Zajimavosti from "./routes/zajimavosti.jsx";

// Routy se importují **staticky**, lazy je jen `page.jsx` (návrh docs/proposal-section-loading.md,
// A3, 2026-11-24). Route chunky měly po 1–6 kB a za každým šla druhá vlna drobných sdílených
// chunků -- na pomalé síti to byla celá fáze `Suspense` s patičkou ve viewportu navíc, kvůli
// pár kilobajtům proti stovkám kB knihoven uu5. `page.jsx` zůstává lazy, protože přes časovou
// osu historie táhne `uu5extrasg01` a text všech obsahových stránek (`content/page-content.js`).
// Administrace tu není vůbec — je to vlastní UVE (admin/app.jsx, /admin/). Co web smí mít
// staticky, hlídá `lazy-libs.test.js`.
// `Utils.Component.lazy` je uu5 obálka nad `React.lazy`.
const Page = Utils.Component.lazy(() => import("./routes/page.jsx"));

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
  // návrat jsou dva importy, dva řádky tady, záznamy v `config/seo.js`
  // a `server/seo/route-seo.js` a pravidlo v `server/legacy-redirect.js`.

  kontakt: <Kontakt />,
  // Klub → Zajímavosti, po kategoriích (`?kategorie=men-a`).
  zajimavosti: <Zajimavosti />,
  // Obsahové stránky sdílí jednu obrazovku a rozlišuje je routa; seznam je zdroj pravdy
  // v `content/pages.js`, aby se nová stránka přidávala na jednom místě.
  ...Object.fromEntries(PAGE_CODE_LIST.map((code) => [code, <Page />])),

  "*": <NotFound />,
};

// Obal routy drží trvale aspoň výšku okna bez lišty, takže patička při prvním vykreslení každé
// routy začíná pod ohybem a neposkočí ani při mountu, ani když dorazí data (návrh
// docs/proposal-section-loading.md, A1). Dřív byla ve viewportu po celou dobu fallbacku
// i skeletonů (`Page` z caio-ui má `min-height: 100vh` a `main` roste) a každý další kus obsahu
// ji posunul -- většina CLS webu. Obal je **kolem** `Suspense`, takže platí pro fallback i obsah.
//
// `100vh`, ne `100svh`: na mobilu je `vh` velký viewport, patička je pod hranou i se zobrazenou
// lištou prohlížeče. Cena: krátké stránky (`/kontakt` na mobilu) mají nad patičkou volné místo
// a patička se ukáže až po scrollu (schváleno 2026-11-24, varianta A2 se skrytou patičkou
// zůstává jako záloha).
const ROUTE_HEIGHT = `calc(100vh - ${Config.theme.topHeight}px)`;
const ROUTE_CLASS = Config.Css.css({ minBlockSize: ROUTE_HEIGHT });
// Fallback (`page.jsx`) vyplní celý obal, ne jen 320 px.
const FALLBACK = <PageLoading height={ROUTE_HEIGHT} />;

function Router() {
  const element = useRouter(ROUTE_MAP);
  const [route] = useRoute();

  // ErrorBoundary dodává `UiApp.Spa`; tady stačí Suspense pro lazy chunk. `key` odvozený
  // z routy hranici po přechodu jinam resetuje — jinak by chyba na jedné obrazovce zůstala
  // viset i po odkliknutí pryč.
  return (
    <div className={ROUTE_CLASS}>
      <Suspense fallback={FALLBACK} key={route?.uu5Route}>
        {element}
      </Suspense>
    </div>
  );
}

export default Router;
