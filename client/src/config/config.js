import { Utils } from "uu5g05";
import theme from "./theme.js";

// Config.Css.css() je stylovací primitivum celého stacku (emotion pod kapotou) a řeší pořadí
// stylů mezi načtenými knihovnami. Vzor převzatý z caio-ui a caio_propertyman, jen s vlastním
// TAGem.
//
// process.env.NAME / OUTPUT_NAME / VERSION dodává devkit přes `define:` z client/package.json.
// Bez nich to v prohlížeči spadne na "process is not defined" — proto se vite.config.js
// nechává prázdný (createViteConfig() bez parametrů).

const TAG = "Afk.";

// Statické soubory z client/public/. Vite je kopíruje do build outputu 1:1, takže cesta je
// absolutní od rootu webu — ne import, aby se obrázek nebalil do bundlu. Erb v liště je
// tatáž ikona, kterou používá manifest.json a favicon, aby se nemohly rozejít.
const asset = {
  logo: "/assets/meta/icon-192.png",
  logoTransparent: "/assets/icon-192-transparent.png",
};

// Číselníky. Drží se tu jen **kódy a pořadí**, popisky jsou v LSI (`enum.age.*`,
// `enum.position.*`) — jinak by web uměl česky na dvou různých místech.
//
// `AGE_LIST` je úplný výčet věkových skupin, ne seznam kategorií, které klub má. Které
// existují v daném ročníku, říká `season/listCurrent`; složení mužstev se mění rok od roku
// (design/frontend.md, 2.5).
// Věkové skupiny (`category.age`), stejné jako `server/config.js`. Konkrétní kategorie
// (A/B/C týmy, U15 B…) jsou v kolekci `afk_category` a spravují se v administraci.
const AGE_LIST = ["men", "u19", "u17", "u15", "u13", "u11", "u9", "women", "old"];
const POSITION_LIST = ["GK", "DF", "MF", "FW"];
const MATCH_STATE_LIST = ["planned", "played", "postponed", "canceled"];
const COACH_ROLE_LIST = ["headCoach", "assistant", "manager", "board"];
const GALLERY_CATEGORY_LIST = ["match", "training", "fans", "youth", "club"];

// Binární kolekce, do které patří soubory ke stažení. Musí sedět se `server/config.js`
// (`BINARY_COLLECTION.DOWNLOAD`) — podle ní `binary/*` autorizuje zápis.
const BINARY_COLLECTION_DOWNLOAD = "download";

// Popisky sítí z `appConfig.socialList`. Nejsou v LSI schválně — jsou to obchodní názvy,
// které se nepřekládají.
//
// **Nejsou to ikony.** GDS stencil sada nemá skupinu `logo` (má `alert`, `arrow`, `badge`,
// `communication`, … a to je vše), takže `uugdsstencil-logo-facebook` se vykreslí jako
// prázdné místo se správnou šířkou — přesně ten případ z `component-tree.md`, F.2.
// Ověřeno v prohlížeči 7. 9. 2026. Odkazy jsou proto textové.
const SOCIAL_LABEL = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
};

// Kódy obsahových stránek tu **nejsou**: stránky jsou natvrdo v `content/pages.js`
// a jeho `PAGE_CODE_LIST` je zdroj pravdy pro routu i pro menu. Dvojí seznam by se
// rozešel hned, jak by někdo přidal stránku.

// Role. Rozsahová `teamEditor:<teamId>` se v guardu píše jako "teamEditor:*" —
// `UiApp.withRoute` prefix umí, konkrétní id vytáhne `UiAuth.getScopeList()`.
// Množiny odpovídají `server/config.js`; role se **nedědí**, takže se vypisují celé.
const ROLE = {
  MEMBERS: "members",
  TEAM_EDITOR: "teamEditor",
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
// Obrazovky, na které smí i editor jednoho mužstva.
const TEAM_SCOPED = [ROLE.TEAM_EDITOR + ":*"];

// Adresa webu pro canonical a `og:url` (tools/page-meta.js). Dosazuje ji `client/vite.config.js`
// z `APP_URL` v kořenovém `.env` (tentýž soubor čte server pro sitemapu); bez ní null.
const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "") || null;

const Config = {
  TAG,
  asset,
  appUrl,
  theme,

  AGE_LIST,
  POSITION_LIST,
  MATCH_STATE_LIST,
  COACH_ROLE_LIST,
  GALLERY_CATEGORY_LIST,
  BINARY_COLLECTION_DOWNLOAD,
  SOCIAL_LABEL,

  ROLE,
  ADMIN,
  CONTENT,
  MATCH,
  NEWS,
  GALLERY,
  PAGES,
  MEMBER,
  TEAM_SCOPED,

  Css: Utils.Css.createCssModule(
    TAG.replace(/\.$/, "").toLowerCase().replace(/\./g, "-").replace(/[^a-z-]/g, ""),
    // Druhý argument je `owner` (atribut data-owner na <style>): drží sheets jedné knihovny
    // pohromadě a tím i jejich pořadí vůči uu5.
    process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION,
  ),
};

export default Config;
