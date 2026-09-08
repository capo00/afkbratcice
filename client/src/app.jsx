import { Lsi, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiApp, UiAuth } from "caio-ui";
import Config from "./config/config.js";
import importLsi from "./lsi/import-lsi.js";
import Router from "./router.jsx";
import Footer from "./components/layout/footer.jsx";
import NoticeBar from "./components/layout/notice-bar.jsx";
import { AppProvider } from "./core/app-context.jsx";
import { PAGE_CODE_LIST } from "./content/pages.js";
import { ADMIN_MENU, ANY_ADMIN_PROFILE } from "./admin/menu.js";

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
      icon: "uugds-account",
      // children: loginLabel.toUpperCase(),
      onClick: () => session.login(),
      colorScheme: "building",
      collapsed: "never",
    };
  }

  return {
    children: <Uu5Elements.RichIcon imageSrc={session.identity.photo} size="m" significance="subdued" className={Config.Css.css({ marginInline: -16 })} />,
    itemList: [
      { children: <Uu5Elements.Header title={session.identity.name} subtitle={session.identity.identity} /> },
      { divider: true },
      { icon: "uugds-log-out", children: "Odhlásit se", onClick: () => session.logout() }
    ],
    colorScheme: "building",
    collapsed: "never",
    iconOpen: null,
    iconClosed: null,
  };
}

/** Název klubu vedle erbu — dva řádky sázené GDS tokeny, ale klubovým písmem. */
function ClubName({ name, since }) {
  return (
    // Dva řádky nalepené na sebe, vycentrované na výšku lišty: `rowGap={0}` je tu proto,
    // že výchozí mezera `Grid` (24 px z `loose`) je mezera mezi dlaždicemi, ne mezi řádky
    // jednoho popisku.
    <Uu5Elements.Grid alignContent="center" rowGap={0}>
      <Uu5Elements.Text category="interface" segment="title" type="minor">
        {({ style }) => (
          <span
            className={Config.Css.css({
              ...style,
              ...theme.typography.display,
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            })}
          >
            {name}
          </span>
        )}
      </Uu5Elements.Text>
      <Uu5Elements.Text category="interface" segment="highlight" type="small" colorScheme="primary">
        {({ style }) => (
          <span
            className={Config.Css.css({
              ...style,
              ...theme.typography.eyebrow,
            })}
          >
            {since}
          </span>
        )}
      </Uu5Elements.Text>
    </Uu5Elements.Grid>
  );
}

// Administrace v liště. Nabídne se **jen tomu, kdo na ni má** — a s podpoložkami jen na ty
// obrazovky, které smí otevřít; zašedlé položky se v tomhle webu nepoužívají (frontend.md, 2.2).
// Nepřihlášenému nebo běžnému členovi se položka nevykreslí vůbec (`undefined` v `itemList`
// uu5 přeskočí).
function useAdminItem() {
  const session = UiAuth.useSession();
  const adminLabel = useLsi(importLsi, ["header", "nav", "admin"]);
  const menuLsi = useLsi(importLsi, ["admin", "menu"]);

  if (!UiAuth.hasProfile(session.identity, ANY_ADMIN_PROFILE)) return undefined;

  return {
    href: "admin",
    children: adminLabel.toUpperCase(),
    significance: "subdued",
    colorScheme: "building",
    itemList: ADMIN_MENU.filter((item) => UiAuth.hasProfile(session.identity, item.profileList)).map((item) => ({
      href: item.route,
      icon: item.icon,
      children: menuLsi[item.code]?.header ?? item.code,
    })),
  };
}

// Menu je **plochý seznam rout**, ne strom. Mužstva mívala rozbalovací podpoložky
// s kategoriemi aktuálního ročníku, ale byla to práce navíc pro obě strany: návštěvník
// musel trefit položku v rozbaleném seznamu, aby se dostal tam, kde stejně uvidí všechna
// mužstva vedle sebe s logem, soutěží a trenérem. Přehled mužstev tuhle volbu udělá líp
// než menu, takže se na něj jen proklikne (rozhodnuto 8. 9. 2026).
//
// Jediná položka, která si podpoložky nechává, je administrace — tam jsou to opravdu různé
// obrazovky, ne jeden seznam.
function useTop() {
  const clubName = useLsi(importLsi, ["club", "name"]);
  const clubSince = useLsi(importLsi, ["club", "since"]);
  const identityItem = useIdentityItem();
  const newsLabel = useLsi(importLsi, ["header", "nav", "news"]);
  const teamsLabel = useLsi(importLsi, ["header", "nav", "teams"]);
  const galleryLabel = useLsi(importLsi, ["header", "nav", "gallery"]);
  const clubLabel = useLsi(importLsi, ["header", "nav", "club"]);
  const contactLabel = useLsi(importLsi, ["header", "nav", "contact"]);
  const pageLsi = useLsi(importLsi, ["page", "name"]);
  const adminItem = useAdminItem();

  return {
    logo: { uri: Config.asset.logoTransparent, href: "/", significance: "subdued" },
    // Dvouřádkový název vedle erbu. `children` Topu je jeho volný obsah.
    //
    // Skládá se **z vlastních elementů, ne z `Uu5Elements.Header`**. Header nemá token pro
    // font a title i subtitle si renderuje jako `Uu5Elements.Text` s explicitní
    // `font-family`, takže zdědění z rodiče nestačí — jediná cesta k němu vedla přes
    // selektor `[data-name="Uu5Elements.Text"]`. A ten **v produkčním buildu neexistuje**:
    // `data-name` je vývojová pomůcka, kterou uu5 v produkci nevypisuje, takže erb měl
    // v ostrém provozu vedle sebe Barlow místo Bebasu (nalezeno 7. 9. 2026).
    //
    // Velikost dál počítá GDS přes `Uu5Elements.Text` a jeho `children` jako funkci —
    // stejný postup jako `components/layout/heading.jsx`. Přebíjí se jen to, co token nemá:
    // rodina písma, prostrkání a verzálky.
    children: <ClubName name={clubName} since={clubSince} />,
    // GDS paleta `building` je bílá a nepřenastaví se, takže tmavá lišta jde přes
    // cssBackground/cssColor.
    cssBackground: theme.color.bg,
    cssColor: theme.color.fg,
    menu: {
      // `.filter(Boolean)`: položka administrace je `undefined`, dokud se nepřihlásí někdo,
      // kdo na ni má.
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
        identityItem,
      ].filter(Boolean),
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
