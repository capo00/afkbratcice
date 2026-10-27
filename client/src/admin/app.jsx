import { useRouter, useRoute, Suspense, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp } from "caio-ui";
import Config from "../config/config.js";
import { AppProvider } from "../core/app-context.jsx";
import { ADMIN_MENU, ANY_ADMIN_PROFILE } from "../config/admin-menu.js";
import { useAdminTop } from "./top.jsx";
import { useAdminHintSync } from "./use-admin-hint-sync.js";

// Kořen UVE administrace (admin/index.html, /admin/…). Do 2026-10-24 byla administrace lazy
// routa `admin/*` uvnitř webu; vlastní UVE je podle caio_propertyman: vlastní dokument,
// vlastní bundle a vlastní kus URL. Návštěvník webu tak kód administrace ani její knihovny
// (`uu5tilesg02*`, `uu5codekitg01-forms`) nestahuje vůbec, ne jen líně. Web o administraci
// neví, jen v liště ukáže odkaz, když se tu někdo přihlásil (tools/admin-hint.js).
//
// Adresy se nezměnily: `/admin/clubs` je dál `/admin/clubs`, jen routa uvnitř je `clubs`
// (`data-uu-app-base="/admin/"`).

const LANGUAGE_LIST = ["cs"];

// Obrazovky se načítají lazy -- kdo jde zapsat výsledek, nemá stahovat galerii.
const SCREEN = {
  "": Utils.Component.lazy(() => import("./screens/home.jsx")),
  clubs: Utils.Component.lazy(() => import("./screens/clubs.jsx")),
  teams: Utils.Component.lazy(() => import("./screens/teams.jsx")),
  categories: Utils.Component.lazy(() => import("./screens/categories.jsx")),
  seasons: Utils.Component.lazy(() => import("./screens/seasons.jsx")),
  matches: Utils.Component.lazy(() => import("./screens/matches.jsx")),
  persons: Utils.Component.lazy(() => import("./screens/persons.jsx")),
  players: Utils.Component.lazy(() => import("./screens/players.jsx")),
  coaches: Utils.Component.lazy(() => import("./screens/coaches.jsx")),
  articles: Utils.Component.lazy(() => import("./screens/articles.jsx")),
  galleries: Utils.Component.lazy(() => import("./screens/galleries.jsx")),
  files: Utils.Component.lazy(() => import("./screens/files.jsx")),
  identities: Utils.Component.lazy(() => import("./screens/identities.jsx")),
  config: Utils.Component.lazy(() => import("./screens/config.jsx")),
};

/**
 * Routy i s guardem.
 *
 * `withRoute` je **UX, ne bezpečnostní hranice** — rozhoduje server. Nepřihlášený uvidí
 * `UiAuth.Unauthenticated` s tlačítkem na přihlášení, kdo na obrazovku nemá, `Unauthorized`
 * (design/frontend.md, 2.2). Množiny rolí drží `config/admin-menu.js`, aby se rozcestník, lišta a guard
 * nemohly rozejít.
 */
function buildRouteMap() {
  const Home = UiApp.withRoute(SCREEN[""], { profileList: ANY_ADMIN_PROFILE });
  const routeMap = { "": <Home /> };

  for (const item of ADMIN_MENU) {
    const Screen = SCREEN[item.route];
    // Obrazovka, která ještě není napsaná, se **nezaregistruje** — lepší rozcestník než
    // položka, která vede na prázdno.
    if (!Screen) continue;
    const Guarded = UiApp.withRoute(Screen, { profileList: item.profileList });
    routeMap[item.route] = <Guarded />;
  }

  // Administrace nemá co ukazovat jako „nenalezeno“ a do vyhledávání nepatří: neznámá
  // adresa skončí na rozcestníku.
  routeMap["*"] = { redirect: "" };
  return routeMap;
}

const ROUTE_MAP = buildRouteMap();

const FALLBACK = (
  <div className={Config.Css.css({ display: "flex", justifyContent: "center", padding: 96 })}>
    <Uu5Elements.Pending size="xl" />
  </div>
);

function AdminFrame() {
  const top = useAdminTop();
  // Značka pro web: v tomhle prohlížeči se někdo přihlásil do administrace.
  useAdminHintSync();
  const element = useRouter(ROUTE_MAP);
  const [route] = useRoute();

  return (
    // Sekce si gutter i rytmus řeší samy (components/layout/section.jsx) jako na webu, main
    // nepřidává odsazení. Patička webu sem nepatří -- kontakt na klub správce nepotřebuje.
    <UiApp.Spa top={top} main={{ padding: false, sticky: "always" }}>
      {/* `key` z routy resetuje hranici po přechodu jinam, jinak by chyba jedné obrazovky
          zůstala viset i po odkliknutí pryč. */}
      <Suspense fallback={FALLBACK} key={route?.uu5Route}>
        {element}
      </Suspense>
    </UiApp.Spa>
  );
}

function AdminApp() {
  return (
    // Stejné `loose` mezery jako na webu: obrazovky administrace stojí na týchž sekcích
    // a kartách, takže by se jinak lišily jen hustotou.
    <Uu5Elements.SpacingProvider type="loose">
      <UiApp.SpaProvider languageList={LANGUAGE_LIST}>
        {/* Konfigurace a mapa týmů jako na webu: obrazovky z ní berou názvy a loga týmů
            a po zápisu ji obnovují (`useApp().reload`). */}
        <AppProvider>
          <AdminFrame />
        </AppProvider>
      </UiApp.SpaProvider>
    </Uu5Elements.SpacingProvider>
  );
}

export default AdminApp;
