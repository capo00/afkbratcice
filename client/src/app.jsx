import { useLsi, ErrorBoundary } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp, UiAuth } from "caio-ui";
import Config from "./config/config.js";
import importLsi from "./lsi/import-lsi.js";
import Router from "./router.jsx";
import Footer from "./components/layout/footer.jsx";
import ClubName from "./components/layout/club-name.jsx";
import { AppProvider } from "./core/app-context.jsx";
import AppError from "./components/layout/app-error.jsx";
import { PAGE_CODE_LIST } from "./content/pages.js";
import { usePageMeta } from "./tools/page-meta.js";
import { ANY_ADMIN_PROFILE } from "./config/admin-menu.js";
import clientConfig from "../client.config.js";

const { theme } = Config;

// Parametry, jejichž změna je pořád táž stránka (scroll nahoru se nedělá).
const SAME_PAGE_PARAM_LIST = ["seasonId"];


// Menu je **plochý seznam rout**, ne strom. Mužstva mívala rozbalovací podpoložky
// s kategoriemi aktuálního ročníku, ale byla to práce navíc pro obě strany: návštěvník
// musel trefit položku v rozbaleném seznamu, aby se dostal tam, kde stejně uvidí všechna
// mužstva vedle sebe s logem, soutěží a trenérem. Přehled mužstev tuhle volbu udělá líp
// než menu, takže se na něj jen proklikne (rozhodnuto 8. 9. 2026).
//
// Podpoložky má jen Klub (obsahové stránky). Administrace je vlastní UVE s vlastní lištou,
// web na ni odkazuje ikonou (`adminLink`), vždy. Nepřihlášenému je to ikona osoby
// a „Přihlásit se“, přihlášenému ikona administrace (caio-ui `Top`, Caio 2026-11-10). Když se
// v tomhle prohlížeči někdo přihlásil do administrace (značku zapisuje admin/app.jsx) nebo je
// na webu přihlášený někdo s právem do ní, `Top` ji nesbalí; jinak se při nedostatku místa
// sbalí jako první do menu.
// Přepínač světlého a tmavého režimu přidává `Top` sám.
function useTop() {
  const { state } = UiAuth.useSession();
  const teamsLabel = useLsi(importLsi, ["header", "nav", "teams"]);
  const clubLabel = useLsi(importLsi, ["header", "nav", "club"]);
  const highlightsLabel = useLsi(importLsi, ["header", "nav", "highlights"]);
  const contactLabel = useLsi(importLsi, ["header", "nav", "contact"]);
  const pageLsi = useLsi(importLsi, ["page", "name"]);

  return {
    logo: { imageSrc: Config.asset.logoTransparent, href: "/", significance: "subdued" },
    // Dvouřádkový název vedle erbu (components/layout/club-name.jsx, sdílený s administrací).
    // `children` Topu je jeho volný obsah.
    children: <ClubName />,
    // Lišta je tmavá v obou režimech (Caio 2026-10-25), jako hero pod ní. GDS paleta
    // `building` je bílá a nepřenastaví se, takže barvy jdou přes cssBackground/cssColor --
    // a schválně jako hex tmavé palety, ne `var(--afk-bg)`: `Top` z hexu pozná, že stojí na
    // tmavém, a uu5 položkám menu nastaví tmavý podklad i ve světlém režimu.
    cssBackground: theme.palette.dark.bg,
    cssColor: theme.palette.dark.fg,
    menu: {
      itemList: [
        {
          href: "muzstva",
          children: teamsLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
        },
        // Gallery hidden from the menu (todo.md 2.1); to bring it back, read the label with
        // useLsi(importLsi, ["header", "nav", "gallery"]) like the items around.
        // {
        //   href: "fotogalerie",
        //   children: galleryLabel.toUpperCase(),
        //   significance: "subdued",
        //   colorScheme: "building",
        // },
        {
          // Obsahové stránky pod jednou položkou — samostatně by jich v liště bylo pět
          // a Mužstva by se vytlačila do hamburgeru i na desktopu.
          children: clubLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
          // Zajímavosti (statistiky klubu za celou historii) první, za nimi obsahové stránky
          // v pořadí z `content/pages.js` (Caio 2026-11-19).
          itemList: [
            { href: "zajimavosti", children: highlightsLabel },
            ...PAGE_CODE_LIST.map((code) => ({ href: code, children: pageLsi[code] })),
          ],
        },
        {
          href: "kontakt",
          children: contactLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
        },
      ],
    },
    adminLink: { profileList: ANY_ADMIN_PROFILE },
    // Přihlásit se na webu jde přes `adminLink` (nepřihlášenému je to „Přihlásit se“). Session
    // web má (SpaProvider), takže editor zapíše výsledek i z dlaždice zápasu (match-tile.jsx).
    // Identitu s odhlášením lišta ukáže jen **přihlášenému** — kdo zapisuje pod svým jménem,
    // musí vidět pod jakým a umět se odhlásit (sdílený počítač). Nepřihlášenému ne: jinak by
    // v liště byly dvě ikony osoby s týmž přihlášením.
    displayIdentity: state === "authenticated",
  };
}

// TOP se staví z app-contextu, takže `AppProvider` musí být **nad** `Spa` — lišta je prop,
// ne potomek, a z potomka do ní data nedosáhnou. Během načítání konfigurace je na webu vidět
// boot screen z HTML (core/boot-screen.jsx); menu bez dat stejně nemá co zobrazit.
function Shell() {
  const top = useTop();
  // Nová stránka začíná nahoře; uu5g05 to samo nedělá (caio-ui `useScrollTopOnRouteChange`).
  // Jinou stránkou je i jiné `id` na téže routě (z hráče na hráče); přepnutí sezóny u mužstva
  // nechá čtenáře, kde byl.
  UiApp.useScrollTopOnRouteChange({ ignoreParamList: SAME_PAGE_PARAM_LIST });
  // Titulek, popis, canonical a `og:*` podle routy (tools/page-meta.js, config/seo.js).
  usePageMeta();

  return (
    <UiApp.Spa
      top={top}
      footer={<Footer />}
      // Sekce si gutter i vertikální rytmus řeší samy (components/layout/section.jsx),
      // takže main nesmí přidávat odsazení ani šířku. `sticky` je prop `Page`, ne lišty —
      // výchozí "onScrollUp" by lištu při scrollování dolů schovávalo, předloha ji chce
      // vidět pořád.
      main={{ padding: false, sticky: "always" }}
      errorFallback={AppError}
    >
      {/* Upozornění redakce tu **není schválně** — vykresluje se u mužstva, kam obsahem
          patří, ne nad každou obrazovkou webu (components/layout/notice-bar.jsx). */}
      <Router />
    </UiApp.Spa>
  );
}

function App() {
  return (
    // Web, ne aplikace: `loose` zvedá vnitřní mezery uu5 komponent (padding `Tile` z 8 na
    // 16, `gap` v `Grid` z 16 na 24) bez jediného řádku CSS. Obaluje všechno včetně lišty
    // a patičky, ne jednotlivé sekce.
    <Uu5Elements.SpacingProvider type="loose">
      {/* `config`: client.config.js -- výchozí hodnoty lišty a seznamů z caio-ui. */}
      <UiApp.SpaProvider config={clientConfig}>
        {/* `AppProvider` a lišta (`useTop` v `Shell`) jsou nad ErrorBoundary `UiApp.Spa`; chyba v nich
            by bez téhle hranice odmontovala celou appku a nechala bílou stránku. */}
        <ErrorBoundary fallback={AppError}>
          <AppProvider>
            <Shell />
          </AppProvider>
        </ErrorBoundary>
      </UiApp.SpaProvider>
    </Uu5Elements.SpacingProvider>
  );
}

export default App;
