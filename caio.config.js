// Konfigurace appky, vrstva 2 (caio-devkit README, „Konfigurace appky“): co je stejné pro server
// i klienta nebo co potřebuje build. Klíče 1. úrovně jsou standardní -- devkit i caio-server je
// znají a validují, neznámý klíč shodí build i start. Vlastní hodnoty appky jsou jen pod `app`
// (server `AppConfig.app` z caio-serveru, klient `UiApp.AppConfig.app`).
//
// Co je jen pro server, je v server/server.config.js, co jen pro klienta, v client/client.config.js.
// Co mění správce za běhu (kontakt, upozornění, pořadí kategorií), není konfigurace, ale Nastavení
// (`sys_settings`, design/config.md).

// Role jsou volné stringy v `profileList`; knihovna je nevaliduje a NEDĚDÍ, takže se do každé
// množiny vypisují celé (design/roles.md, sekce 4). Server je ta skutečná hranice (`auth:` use
// casů), klient podle stejných množin jen rozhoduje, co komu ukáže.
const ROLE = {
  members: "members",
  // Rozsahová: `teamEditor:<teamId>`.
  teamEditor: "teamEditor",
  matchEditor: "matchEditor",
  newsEditor: "newsEditor",
  galleryEditor: "galleryEditor",
  contentEditor: "contentEditor",
  operatives: "operatives",
  authorities: "authorities",
};

const ADMIN = [ROLE.authorities];
const CONTENT = [ROLE.operatives, ...ADMIN];

export default {
  // Titulek kořenového dokumentu, jméno a popis v manifestu, jméno na boot screenu, og:site_name.
  name: "AFK Bratčice",
  description:
    "Fotbalový klub AFK Bratčice od roku 1932 – program zápasů, výsledky, tabulky a soupisky mužů, mládeže i staré gardy.",

  // Jediný jazyk: jen `<html lang>` a og:locale, žádné adresy /cs/….
  languages: ["cs"],

  // Dvě palety se stejnými rolemi -- jediné místo, kde smí být hex (oklch originály a role
  // v design/ux-design-system.md, sekce 1). Tmavá je předloha webu, světlá schválená 2026-10-25.
  // `negative` je oranžová z uuGds místo červené: klubová červená je primární barva (Caio 2026-10-25).
  theme: {
    prefix: "afk",
    palette: {
      light: {
        bg: "#FAF6F4",
        card: "#FFFCFA",
        muted: "#F1EAE7",
        accent: "#FBE3DF",
        border: "#E3D8D5",
        input: "#C9BCB8",
        fg: "#1C1312",
        mutedFg: "#6B5E5B",
        clubRed: "#D01319",
        clubRedBright: "#F92725",
        onRed: "#FEF7F2",
      },
      dark: {
        bg: "#070404",
        card: "#120D0C",
        muted: "#1D1716",
        accent: "#2A1B19",
        border: "#2C2423",
        input: "#362E2D",
        fg: "#F3EFED",
        mutedFg: "#99908E",
        clubRed: "#D01319",
        clubRedBright: "#F92725",
        onRed: "#FEF7F2",
      },
    },
    meaning: { primary: "clubRed", negative: "warning" },
  },

  // Boot screen všech UVE: erb a jméno z `name`; barvy z tématu.
  boot: {
    logo: "/assets/icon-192-transparent.png",
    nameUppercase: true,
    logoSize: "60%",
  },

  // Barva lišty nainstalované appky (theme_color manifestu): klubová červená ze světlé palety.
  pwa: { themeColor: "clubRed" },

  // Administrace je vlastní UVE (client/src/admin/), titulek „Administrace · AFK Bratčice“;
  // neveřejná je sama od sebe (noindex, robots.txt).
  uves: { admin: { title: "Administrace" } },

  deploy: { project: "afkbratcice", keepVersions: 3 },

  // Číselníky a role, které potřebuje server i klient. Drží se tu jen kódy a pořadí, popisky jsou
  // v LSI klienta (`enum.*`); každý kód má popisek, hlídá client/src/config/enum-lsi.test.js.
  app: {
    // Věkové skupiny (`category.age`). Úplný výčet, ne kategorie, které klub má: ty jsou v kolekci
    // `afk_category` a které hrají v daném ročníku, říkají sezóny (design/frontend.md, 2.5).
    ageList: ["men", "u19", "u17", "u15", "u13", "u11", "u9", "women", "old"],
    // Linie na soupisce, v pořadí skupin.
    positionList: ["GK", "DF", "MF", "FW"],
    // Přesný post v sestavě zápasu (Caio, 2026-10-26): kód -> linie, v pořadí, v jakém se nabízí
    // ve formuláři (brankář, obrana, záloha, útok). Převod z v0 je v server/services/lineup-position.js.
    lineupPositionMap: {
      GK: "GK",
      RB: "DF",
      LB: "DF",
      CB: "DF",
      FCB: "DF",
      RCB: "DF",
      LCB: "DF",
      RM: "MF",
      LM: "MF",
      CM: "MF",
      RCM: "MF",
      LCM: "MF",
      CDM: "MF",
      RDM: "MF",
      LDM: "MF",
      RCDM: "MF",
      LCDM: "MF",
      CAM: "MF",
      RAM: "MF",
      LAM: "MF",
      RCAM: "MF",
      LCAM: "MF",
      RF: "FW",
      LF: "FW",
      CF: "FW",
      ST: "FW",
      RS: "FW",
      LS: "FW",
    },
    matchStateList: ["planned", "played", "postponed", "canceled"],
    articleStateList: ["draft", "published", "archived"],
    galleryStateList: ["draft", "published"],
    galleryCategoryList: ["match", "training", "fans", "youth", "club"],
    // Vedení: funkce v týmu a funkce ve výboru AFK (design/data-model.md, sekce 7).
    teamRoleList: ["coach", "assistant", "manager"],
    boardRoleList: ["chairman", "viceChairman", "secretary", "member"],

    role: ROLE,
    // Kdo smí co (design/roles.md). Rozsahová `teamEditor:*` tu není: přidává se k množinám
    // tam, kde editor jednoho mužstva smí taky.
    roleGroup: {
      admin: ADMIN,
      content: CONTENT,
      match: [ROLE.matchEditor, ...CONTENT],
      news: [ROLE.newsEditor, ...CONTENT],
      gallery: [ROLE.galleryEditor, ...CONTENT],
      pages: [ROLE.contentEditor, ...CONTENT],
      member: [ROLE.members, ...CONTENT],
    },

    // Výchozí hodnoty nastavení klubu, které mění správce za běhu (`sys_settings.app`, design/config.md)
    // -- platí, dokud je neuloží, a zároveň určují tvar. Všechno je veřejné (`sys/settings/get`):
    // tajemství klub v nastavení nemá a názvy kategorií souborů potřebuje i veřejná stránka „Ke
    // stažení“ (Caio 2026-11-02); `private` je proto prázdné. Server je doplňuje v
    // server/app-settings/, klient v src/core/app-context.jsx a formuláři Nastavení.
    settingsDefaults: {
      public: {
        // Proužek s upozorněním na detailu mužstva; prázdný = žádný.
        notice: "",
        // Rok založení pro dlaždici statistik a patičku.
        founded: 1932,
        // Kódy kategorií (`afk_category.code`), od nejstarších; stará garda je výjimka na konci.
        // Kategorie, která v pořadí není, jde na konec (server/services/season.js).
        categoryOrder: ["men-a", "men-b", "men-c", "u19", "u17", "u15", "u15-b", "u13", "u11", "u9", "women", "old"],
        // Věkové skupiny (`category.age`): u dorostu se jména ukazují, u žáků a mladších ne.
        hideNamesAgeList: ["u15", "u13", "u11", "u9"],
        // `{ address, email, phone, ico, gps, mapUrl }`
        contact: {},
        // `[{ code, uri }]`, kódy z client.config.js `app.socialLabel`
        socialList: [],
        // Kategorie souborů ke stažení `[{ code, name }]` (náhrada v0 `serial`).
        fileCategoryList: [],
      },
      private: {},
    },

    // Kolekce binárek (`binary/*`). Autorizace je per kolekce -- fotograf, který nahrává do galerie,
    // nemá přepsat logo klubu (design/roles.md, 5.1); mapu kolekcí na role staví server/api.js.
    binaryCollection: {
      sys: "sys",
      club: "club",
      // Erb je od 2026-09-11 na `club`; `team` zůstává vyhrazené pro plánovanou týmovou fotku
      // (design/data-model.md, 2.2, pole `photoId`) -- fotka je vlastnost jednoho mužstva v jedné
      // sezóně, ne klubu jako celku.
      team: "team",
      person: "person",
      article: "article",
      gallery: "gallery",
      page: "page",
      // Soubory ke stažení (rozpisy zápasů, formuláře). Čte se veřejně; nahrává je administrace.
      download: "download",
    },
  },
};
