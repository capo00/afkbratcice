import { Lsi, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp, UiAuth } from "caio-ui";
import Config from "./config/config.js";
import importLsi from "./lsi/import-lsi.js";
import Router from "./router.jsx";
import Footer from "./components/layout/footer.jsx";
import NoticeBar from "./components/layout/notice-bar.jsx";
import { AppProvider, useApp } from "./core/app-context.jsx";

const { theme } = Config;

const LANGUAGE_LIST = ["cs"];

// Položka identity si přidává aplikace — `Top` ji sám nepřidává (README caio-ui: přijde až
// s propem `displayIdentity`, který zatím není). Nepřihlášenému *Přihlásit se*, přihlášenému
// jeho jméno; `login()` otevře popup na /login.html.
function useIdentityItem() {
  const session = UiAuth.useSession();
  const loginLabel = useLsi(importLsi, ["header", "login"]);

  if (session.state !== "authenticated") {
    return {
      children: loginLabel,
      onClick: () => session.login(),
      significance: "distinct",
      colorScheme: "building",
      collapsed: "never",
    };
  }

  return {
    children: <UiAuth.IdentityItem {...session.identity} />,
    itemList: [{ children: "Odhlásit se", onClick: () => session.logout() }],
    significance: "subdued",
    colorScheme: "building",
    collapsed: "never",
  };
}

// Menu se staví **z dat, ne z konfigurace**: pro každou kategorii, kterou klub v aktuálním
// ročníku má, přibude položka s podpoložkami. Přidání mužstva je pak založení sezóny
// v administraci, ne nasazení (design/frontend.md, 2.5).
function useTop() {
  const { categoryList } = useApp();
  const clubName = useLsi(importLsi, ["club", "name"]);
  const clubSince = useLsi(importLsi, ["club", "since"]);
  const identityItem = useIdentityItem();
  const teamsLabel = useLsi(importLsi, ["header", "nav", "teams"]);

  return {
    logo: { uri: Config.asset.logo, href: "" },
    // Dvouřádkový název vedle erbu. `children` Topu je jeho volný obsah.
    //
    // PŘEBITÍ (design/component-tree.md, A.1): `Uu5Elements.Header` nemá token pro
    // font — title i subtitle renderuje jako `Uu5Elements.Text` s vlastní explicitní
    // `font-family`, takže zdědění z rodiče nestačí. Třída cílí na
    // `[data-name="Uu5Elements.Text"]` uvnitř; ta vyšší specificita (třída + atribut)
    // přebije uu5 třídu bez ohledu na pořadí stylesheetů.
    children: (
      <Uu5Elements.Header
        className={Config.Css.css({
          '& [data-name="Uu5Elements.Text"]': {
            fontFamily: theme.font.display,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          },
        })}
        title={clubName}
        subtitle={clubSince}
        paddingTop={false}
        paddingBottom={false}
        paddingHorizontal={false}
      />
    ),
    // GDS paleta `building` je bílá a nepřenastaví se, takže tmavá lišta jde přes
    // cssBackground/cssColor.
    cssBackground: theme.color.bg,
    cssColor: theme.color.fg,
    menu: {
      itemList: [
        {
          href: "teams",
          children: teamsLabel,
          significance: "subdued",
          colorScheme: "building",
          // Podpoložky = kategorie z aktuálního ročníku, každá rovnou na soupisku svého
          // mužstva. Routa je klíčovaná `teamId`, ne kategorií.
          itemList: categoryList.map((category) => ({
            href: `team?id=${category.teamId}`,
            children: category.teamName ?? category.competition,
          })),
        },
        identityItem,
      ],
    },
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
      <NoticeBar />
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
