import { useRouter, useRoute, Suspense, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";

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
const NotFound = Utils.Component.lazy(() => import("./routes/not-found.jsx"));

// uu5g05 routeMap: klíč = cesta, hodnota = element / { redirect } / { rewrite }.
//
// Routy mužstva jsou **klíčované `teamId` v parametru**, ne kategorií: `team?id=<teamId>`
// přežije i to, že kategorie letos není — jen se dostane do archivního režimu. Menu je
// skládá za běhu ze `season/listCurrent`.
// Kanonická adresa úvodní stránky je **`/`, ne `/home`**: `server/legacy-redirect.js` posílá
// `/home` (adresa z v0) natrvalo na `/`, takže kdyby klient renderoval home na `home`, každé
// obnovení stránky by prošlo přesměrováním tam a zpátky. `home` proto zůstává jen jako alias
// pro odkazy, které ho ještě používají.
const ROUTE_MAP = {
  "": <Home />,
  home: { redirect: "" },
  teams: <Teams />,
  team: <Team />,
  "team/matches": <TeamMatches />,
  "team/table": <TeamTable />,
  "team/stats": <TeamStats />,
  match: <Match />,
  round: <Round />,
  player: <Player />,
  gallery: <Gallery />,
  "gallery/detail": <GalleryDetail />,
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
