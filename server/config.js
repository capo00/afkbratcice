import { AppConfig } from "caio-server";
import serverConfig from "./server.config.js";

// Doménové konstanty a číselníky serveru pod jmény, kterými je čte kód. Popisky číselníků tady
// nejsou -- ty patří do LSI klienta; konfigurace drží jen kódy a pořadí (design/config.md).
//
// Hodnoty, které zná i klient (číselníky, role, kolekce binárek), jsou v caio.config.js `app`
// (`AppConfig.app`), serverové, které se opakují ve víc souborech, v server.config.js `app`.
// Tady zůstávají jen ty, které čte jediný soubor serveru.

const { app } = AppConfig;

// Věkové skupiny. Konkrétní kategorie (A/B/C týmy, U15 B…) jsou v kolekci `afk_category`
// a každá z nich patří do jedné skupiny (`category.age`). Mistrovský zápas smí hrát jen týmy
// stejné skupiny, stará garda může hrát proti komukoli a přátelské zápasy jdou napříč
// (match/crud.js). Které kategorie klub v daném ročníku má, se NEODVOZUJE odsud, ale ze sezón
// (season/listCurrent) -- složení mužstev se mění rok od roku.
const AGE_LIST = app.ageList;
// Věková skupina, která smí hrát proti komukoli.
const AGE_ANY_OPPONENT = "old";

// Bodování tabulky. Zachovává chování v0 (cmd/controller/getTable.php); v1 tohle uměl
// jen 3/1/0, což byla proti v0 regrese.
const POINTS = { win: 3, penaltyWin: 2, penaltyLoss: 1, loss: 0, draw: 1 };

// Sezóna začíná v srpnu: yearFrom = měsíc < 8 ? rok - 1 : rok.
const SEASON_START_MONTH = 8;

//@@viewOn:roles
// Role jsou volné stringy v identity.profileList; knihovna je nevaliduje a NEDĚDÍ,
// takže se do každého `auth` vypisují celé množiny (design/roles.md, sekce 4).
const ROLE = {
  MEMBERS: app.role.members,
  TEAM_EDITOR: app.role.teamEditor, // parametrizovaný: teamEditor:<teamId>
  MATCH_EDITOR: app.role.matchEditor,
  NEWS_EDITOR: app.role.newsEditor,
  GALLERY_EDITOR: app.role.galleryEditor,
  CONTENT_EDITOR: app.role.contentEditor,
  OPERATIVES: app.role.operatives,
  AUTHORITIES: app.role.authorities,
};
// The editor of any team (`teamEditor:<teamId>` with a non-empty scope), as a `profileList` entry.
const ANY_TEAM_EDITOR = `${ROLE.TEAM_EDITOR}:*`;
//@@viewOff:roles

//@@viewOn:binary
const { binaryCollection } = app;
const BINARY_COLLECTION = {
  SYS: binaryCollection.sys,
  CLUB: binaryCollection.club,
  TEAM: binaryCollection.team,
  PERSON: binaryCollection.person,
  ARTICLE: binaryCollection.article,
  GALLERY: binaryCollection.gallery,
  PAGE: binaryCollection.page,
  DOWNLOAD: binaryCollection.download,
};

// Rozlišení uvnitř kolekce.
const { binaryType } = serverConfig.app;
const BINARY_TYPE = {
  PHOTO: binaryType.photo,
  PHOTO_THUMB: binaryType.photoThumb,
  LOGO: binaryType.logo,
  DOCUMENT: binaryType.document,
};
//@@viewOff:binary

export default {
  AGE_LIST,
  AGE_ANY_OPPONENT,
  POSITION_LIST: app.positionList,
  LINEUP_POSITION_MAP: app.lineupPositionMap,
  MATCH_STATE: app.matchStateList,
  ARTICLE_STATE: app.articleStateList,
  TEAM_ROLE: app.teamRoleList,
  BOARD_ROLE: app.boardRoleList,
  GALLERY_CATEGORY: app.galleryCategoryList,
  GALLERY_STATE: app.galleryStateList,
  POINTS,
  SEASON_START_MONTH,
  ROLE,
  ADMIN: app.roleGroup.admin,
  CONTENT: app.roleGroup.content,
  MATCH: app.roleGroup.match,
  NEWS: app.roleGroup.news,
  GALLERY: app.roleGroup.gallery,
  PAGES: app.roleGroup.pages,
  MEMBER: app.roleGroup.member,
  ANY_TEAM_EDITOR,
  BINARY_COLLECTION,
  BINARY_TYPE,
};
