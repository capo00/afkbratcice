import { Utils } from "uu5g05";
import { UiApp } from "caio-ui";
import clientConfig from "../../client.config.js";
import theme from "./theme.js";

// Config.Css.css() je stylovací primitivum celého stacku (emotion pod kapotou) a řeší pořadí
// stylů mezi načtenými knihovnami. Vzor převzatý z caio-ui a caio_propertyman, jen s vlastním
// TAGem.
//
// process.env.NAME / OUTPUT_NAME / VERSION dodává devkit přes `define:` z client/package.json.
// Bez nich to v prohlížeči spadne na "process is not defined" — proto se vite.config.js
// nechává prázdný (createViteConfig() bez parametrů).
//
// Hodnoty, které zná i server (číselníky, role, kolekce binárek), jsou v caio.config.js `app`
// (`UiApp.AppConfig.app`), klientské, které se opakují ve víc souborech, v client.config.js `app`.
// Tady jsou pod jmény, kterými je čte kód.

const { app } = UiApp.AppConfig;

const TAG = clientConfig.tag;

// Číselníky. Drží se jen **kódy a pořadí**, popisky jsou v LSI (`enum.age.*`,
// `enum.position.*`) — jinak by web uměl česky na dvou různých místech.
//
// `AGE_LIST` je úplný výčet věkových skupin (`category.age`), ne seznam kategorií, které klub
// má. Konkrétní kategorie (A/B/C týmy, U15 B…) jsou v kolekci `afk_category` a spravují se
// v administraci; které existují v daném ročníku, říká `season/listCurrent` (design/frontend.md, 2.5).

// Kódy obsahových stránek tu **nejsou**: stránky jsou natvrdo v `content/pages.js`
// a jeho `PAGE_CODE_LIST` je zdroj pravdy pro routu i pro menu. Dvojí seznam by se
// rozešel hned, jak by někdo přidal stránku.

// Role. Rozsahová `teamEditor:<teamId>` se v guardu píše jako "teamEditor:*" —
// `UiApp.withRoute` prefix umí, konkrétní id vytáhne `UiAuth.getScopeList()`.
// Role se **nedědí**, takže se množiny vypisují celé (caio.config.js `app.roleGroup`).
const ROLE = {
  MEMBERS: app.role.members,
  TEAM_EDITOR: app.role.teamEditor,
  MATCH_EDITOR: app.role.matchEditor,
  NEWS_EDITOR: app.role.newsEditor,
  GALLERY_EDITOR: app.role.galleryEditor,
  CONTENT_EDITOR: app.role.contentEditor,
  OPERATIVES: app.role.operatives,
  AUTHORITIES: app.role.authorities,
};

const Config = {
  TAG,
  asset: clientConfig.app.asset,
  theme,

  AGE_LIST: app.ageList,
  POSITION_LIST: app.positionList,
  // Přesný post v sestavě: kód -> linie (`POSITION_LIST`), v pořadí formuláře. České názvy jsou
  // v lsi (`enum.lineupPosition`).
  LINEUP_POSITION_MAP: app.lineupPositionMap,
  LINEUP_POSITION_LIST: Object.keys(app.lineupPositionMap),
  MATCH_STATE_LIST: app.matchStateList,
  ARTICLE_STATE_LIST: app.articleStateList,
  GALLERY_STATE_LIST: app.galleryStateList,
  TEAM_ROLE_LIST: app.teamRoleList,
  BOARD_ROLE_LIST: app.boardRoleList,
  GALLERY_CATEGORY_LIST: app.galleryCategoryList,
  // Binární kolekce souborů ke stažení -- podle ní `binary/*` autorizuje zápis.
  BINARY_COLLECTION_DOWNLOAD: app.binaryCollection.download,
  SOCIAL_LABEL: clientConfig.app.socialLabel,
  // Výchozí hodnoty nastavení klubu `{ public, private }` -- platí, dokud je správce neuloží.
  SETTINGS_DEFAULTS: app.settingsDefaults,

  ROLE,
  ADMIN: app.roleGroup.admin,
  CONTENT: app.roleGroup.content,
  MATCH: app.roleGroup.match,
  NEWS: app.roleGroup.news,
  GALLERY: app.roleGroup.gallery,
  PAGES: app.roleGroup.pages,
  MEMBER: app.roleGroup.member,
  // Obrazovky, na které smí i editor jednoho mužstva.
  TEAM_SCOPED: [ROLE.TEAM_EDITOR + ":*"],

  Css: Utils.Css.createCssModule(
    TAG.replace(/\.$/, "").toLowerCase().replace(/\./g, "-").replace(/[^a-z-]/g, ""),
    // Druhý argument je `owner` (atribut data-owner na <style>): drží sheets jedné knihovny
    // pohromadě a tím i jejich pořadí vůči uu5.
    process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION,
  ),
};

export default Config;
