// Doménové konstanty a číselníky. Popisky číselníků tady nejsou -- ty patří do LSI
// klienta; konfigurace drží jen kódy a pořadí (design/config.md, sekce 4).

const ERROR_PREFIX = "afkbratcice";

// Věkové kategorie. Které z nich klub v daném ročníku má, se NEODVOZUJE odsud, ale ze
// sezón (season/listCurrent) -- složení mužstev se mění rok od roku.
const AGE_MAP = {
  old: "Stará garda",
  men: "Muži",
  u18: "Starší dorost",
  u16: "Mladší dorost",
  u14: "Starší žáci",
  u12: "Mladší žáci",
  u10: "Starší přípravka",
  u6: "Mladší přípravka",
};
const AGE_LIST = Object.keys(AGE_MAP);

const POSITION_MAP = { GK: "Brankář", DF: "Obránce", MF: "Záložník", FW: "Útočník" };
const POSITION_LIST = Object.keys(POSITION_MAP);

const MATCH_STATE = ["planned", "played", "postponed", "canceled"];
const ARTICLE_STATE = ["draft", "published", "archived"];
const COACH_ROLE = ["headCoach", "assistant", "manager", "board"];
const GALLERY_CATEGORY = ["match", "training", "fans", "youth", "club"];
const GALLERY_STATE = ["draft", "published"];

// Bodování tabulky. Zachovává chování v0 (cmd/controller/getTable.php); v1 tohle uměl
// jen 3/1/0, což byla proti v0 regrese.
const POINTS = { win: 3, penaltyWin: 2, penaltyLoss: 1, loss: 0, draw: 1 };

// Sezóna začíná v srpnu: yearFrom = měsíc < 8 ? rok - 1 : rok.
const SEASON_START_MONTH = 8;

//@@viewOn:roles
// Role jsou volné stringy v identity.profileList; knihovna je nevaliduje a NEDĚDÍ,
// takže se do každého `auth` vypisují celé množiny (design/roles.md, sekce 4).
const ROLE = {
  MEMBERS: "members",
  TEAM_EDITOR: "teamEditor", // parametrizovaný: teamEditor:<teamId>
  MATCH_EDITOR: "matchEditor",
  NEWS_EDITOR: "newsEditor",
  GALLERY_EDITOR: "galleryEditor",
  CONTENT_EDITOR: "contentEditor",
  OPERATIVES: "operatives",
  AUTHORITIES: "authorities",
};

const ADMIN = [ROLE.AUTHORITIES];
const CONTENT = [ROLE.OPERATIVES, ...ADMIN];
const MATCH = [ROLE.MATCH_EDITOR, ...CONTENT];
const NEWS = [ROLE.NEWS_EDITOR, ...CONTENT];
const GALLERY = [ROLE.GALLERY_EDITOR, ...CONTENT];
const PAGES = [ROLE.CONTENT_EDITOR, ...CONTENT];
const MEMBER = [ROLE.MEMBERS, ...CONTENT];
//@@viewOff:roles

//@@viewOn:binary
// Binárky se dělí do kolekcí a autorizace se nastavuje per kolekce -- fotograf, který
// nahrává do galerie, nemá mít možnost přepsat logo klubu (design/roles.md, 5.1).
const BINARY_COLLECTION = {
  SYS: "sys",
  CLUB: "club",
  // Erb je od 2026-09-11 na `club`; `team` zůstává vyhrazené pro plánovanou týmovou
  // fotku (design/data-model.md, 2.2, pole `photoId`) -- zatím se nezapisuje, ale
  // patří jinam než logo, protože fotka je vlastnost jednoho konkrétního mužstva
  // v jedné sezóně, ne klubu jako celku.
  TEAM: "team",
  PERSON: "person",
  ARTICLE: "article",
  GALLERY: "gallery",
  PAGE: "page",
  // Soubory ke stažení (rozpisy zápasů, formuláře). Čte se veřejně -- co se sem nahraje,
  // je určené ke stažení komukoli.
  DOWNLOAD: "download",
};

// Rozlišení uvnitř kolekce.
const BINARY_TYPE = { PHOTO: "photo", PHOTO_THUMB: "photoThumb", LOGO: "logo", DOCUMENT: "document" };
//@@viewOff:binary

export default {
  ERROR_PREFIX,
  AGE_MAP,
  AGE_LIST,
  POSITION_MAP,
  POSITION_LIST,
  MATCH_STATE,
  ARTICLE_STATE,
  COACH_ROLE,
  GALLERY_CATEGORY,
  GALLERY_STATE,
  POINTS,
  SEASON_START_MONTH,
  ROLE,
  ADMIN,
  CONTENT,
  MATCH,
  NEWS,
  GALLERY,
  PAGES,
  MEMBER,
  BINARY_COLLECTION,
  BINARY_TYPE,
  // Výchozí obsah app_config, když je kolekce prázdná (chování z v1).
  DEFAULT_APP_CONFIG: {
    // Od nejstarších; stará garda je výjimka na konci.
    categoryOrder: ["men", "u18", "u16", "u14", "u12", "u10", "u6", "old"],
    // U dorostu se jména ukazují, u žáků a mladších ne.
    hideNamesAgeList: ["u14", "u12", "u10", "u6"],
    notice: "",
    contact: {},
    socialList: [],
    fileCategoryList: [],
    founded: 1932,
  },
};
