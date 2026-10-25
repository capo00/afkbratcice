import { useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp, UiAuth } from "./tools/caio-ui.js";
import Config from "./config/config.js";
import importLsi from "./lsi/import-lsi.js";
import Router from "./router.jsx";
import Footer from "./components/layout/footer.jsx";
import ClubName from "./components/layout/club-name.jsx";
import { AppProvider } from "./core/app-context.jsx";
import { PAGE_CODE_LIST } from "./content/pages.js";
import { useAdminHint } from "./tools/admin-hint.js";
import { useColorModeItem } from "./tools/color-mode.js";
import { ANY_ADMIN_PROFILE } from "./config/admin-menu.js";

const { theme } = Config;

const LANGUAGE_LIST = ["cs"];

/**
 * Odkaz do administrace (vzor z caio_propertyman `tools/use-web-menu.jsx`). Ukáže se, když se
 * v tomhle prohlížeči někdo přihlásil do administrace (tools/admin-hint.js), nebo když je na
 * webu přihlášený někdo s právem do ní — tedy i ten, kdo se přihlásil z odkazu v e-mailu
 * (`/login.html?invite=…` končí na `/`, ne v administraci) a značku ještě nemá.
 *
 * Administrace je jiný dokument (/admin/, vlastní UVE), ale `Top` ho za „mimo appku“
 * nepovažuje: app base webu je `/`, takže `/admin/` pod ni spadá a `href` by skončil na
 * `setRoute` (jen změna adresy, administrace by se nenačetla). Proto místo `href` vlastní
 * `onClick`, který chování odkazu napodobí: ctrl/cmd-klik a klik kolečkem (Button ho posílá
 * do `onClick` s `button === 1`) otevřou nový panel, obyčejný klik přejde do administrace.
 *
 * Jen ikona, nikdy v hamburgeru. `uugds-settings`, ne `uugds-account` jako v propertymanu: vedle
 * stojí identita přihlášeného, a dvě postavičky by se pletly. Bez `children` si ActionGroup tooltip sám nevezme, proto
 * `tooltip` — zároveň přístupný název tlačítka.
 */
function useAdminItem() {
  const hint = useAdminHint();
  const session = UiAuth.useSession();
  const isAdmin = hint || UiAuth.hasProfile(session.identity, ANY_ADMIN_PROFILE);
  const adminLabel = useLsi(importLsi, ["header", "nav", "admin"]);
  if (!isAdmin) return undefined;

  return {
    icon: "uugds-settings",
    tooltip: adminLabel,
    collapsed: "never",
    onClick: (e) => {
      const newTab = e?.ctrlKey || e?.metaKey || e?.button === 1;
      window.open("/admin/", newTab ? "_blank" : "_self", "noopener");
    },
    significance: "subdued",
    colorScheme: "building",
  };
}

// Menu je **plochý seznam rout**, ne strom. Mužstva mívala rozbalovací podpoložky
// s kategoriemi aktuálního ročníku, ale byla to práce navíc pro obě strany: návštěvník
// musel trefit položku v rozbaleném seznamu, aby se dostal tam, kde stejně uvidí všechna
// mužstva vedle sebe s logem, soutěží a trenérem. Přehled mužstev tuhle volbu udělá líp
// než menu, takže se na něj jen proklikne (rozhodnuto 8. 9. 2026).
//
// Podpoložky má jen Klub (obsahové stránky). Administrace je vlastní UVE s vlastní lištou,
// web na ni jen odkazuje ikonou (`useAdminItem`).
function useTop() {
  const { state } = UiAuth.useSession();
  const newsLabel = useLsi(importLsi, ["header", "nav", "news"]);
  const teamsLabel = useLsi(importLsi, ["header", "nav", "teams"]);
  const galleryLabel = useLsi(importLsi, ["header", "nav", "gallery"]);
  const clubLabel = useLsi(importLsi, ["header", "nav", "club"]);
  const contactLabel = useLsi(importLsi, ["header", "nav", "contact"]);
  const pageLsi = useLsi(importLsi, ["page", "name"]);
  const adminItem = useAdminItem();
  const colorModeItem = useColorModeItem(useLsi(importLsi, ["header", "colorMode"]));

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
      // `.filter(Boolean)`: odkaz do administrace je `undefined`, dokud se v tomhle prohlížeči
      // nepřihlásí někdo, kdo na ni má.
      itemList: [
        {
          href: "novinky",
          children: newsLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
        },
        {
          href: "muzstva",
          children: teamsLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
        },
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
          itemList: PAGE_CODE_LIST.map((code) => ({ href: code, children: pageLsi[code] })),
        },
        {
          href: "kontakt",
          children: contactLabel.toUpperCase(),
          significance: "subdued",
          colorScheme: "building",
        },
        adminItem,
        // Přepínač světlého a tmavého režimu: jen ikona, v liště i na telefonu (canvas
        // světlé verze, varianta A, 2026-10-25).
        colorModeItem,
      ].filter(Boolean),
    },
    // Přihlásit se na webu nejde, přihlašuje se v administraci (admin/top.jsx). Session ale
    // web má (SpaProvider), takže editor přihlášený v administraci zapíše výsledek i z dlaždice
    // zápasu (match-tile.jsx). Proto **přihlášenému** lišta ukáže identitu s odhlášením — kdo
    // zapisuje pod svým jménem, musí vidět pod jakým a umět se odhlásit (sdílený počítač).
    displayIdentity: state === "authenticated",
  };
}

// TOP se staví z app-contextu, takže `AppProvider` musí být **nad** `Spa` — lišta je prop,
// ne potomek, a z potomka do ní data nedosáhnou. Cena za to je, že se během načítání
// konfigurace ukáže samotný spinner bez rámu stránky; je to jen boot SPA a menu bez dat
// stejně nemá co zobrazit.
function Shell() {
  const top = useTop();

  return (
    <UiApp.Spa
      top={top}
      footer={<Footer />}
      // Sekce si gutter i vertikální rytmus řeší samy (components/layout/section.jsx),
      // takže main nesmí přidávat odsazení ani šířku. `sticky` je prop `Page`, ne lišty —
      // výchozí "onScrollUp" by lištu při scrollování dolů schovávalo, předloha ji chce
      // vidět pořád.
      main={{ padding: false, sticky: "always" }}
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
      <UiApp.SpaProvider languageList={LANGUAGE_LIST}>
        <AppProvider>
          <Shell />
        </AppProvider>
      </UiApp.SpaProvider>
    </Uu5Elements.SpacingProvider>
  );
}

export default App;
