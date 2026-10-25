import Config from "../config/config.js";

// Rozcestník administrace — jeden seznam, ze kterého se staví dlaždice na `/admin`
// i podpoložky v liště. Kdo na kterou obrazovku smí, je tady, ne na obrazovce samotné:
// stejné množiny se pak dají použít pro `withRoute` guard i pro to, co se vůbec nabídne.
//
// **Co uživatel nesmí, se nemá ukazovat zašedlé — nemá se ukazovat vůbec** (frontend.md, 2.2).
// Je to UX, ne bezpečnostní hranice; o tu se stará server.

// `ready: false` = obrazovka ještě není napsaná; nenabídne se ani v rozcestníku, ani v liště,
// a `router.jsx` jí neregistruje routu. Položka, která vede na 404, je horší než kratší
// rozcestník. (Dnes jsou hotové všechny — příznak zůstává pro tu příští.)
const ADMIN_MENU = [
  // Klub drží erb (design/data-model.md, 1.2) -- víc věkových kategorií stejného klubu
  // (Chotusice muži/dorost/žáci) na něj odkazuje týmž `clubId`, takže se logo nahrává
  // jednou, ne za každý tým zvlášť. Jen CONTENT, ne TEAM_SCOPED: TE svoje logo neřeší
  // (design/roles.md, 5.2).
  { code: "clubs", route: "admin/clubs", icon: "uugdsstencil-navigation-flag", ready: true, profileList: Config.CONTENT },
  { code: "teams", route: "admin/teams", icon: "uugds-shield", ready: true, profileList: [...Config.CONTENT, ...Config.TEAM_SCOPED] },
  { code: "seasons", route: "admin/seasons", icon: "uugds-calendar", ready: true, profileList: Config.CONTENT },
  { code: "matches", route: "admin/matches", icon: "uugds-sprint", ready: true, profileList: [...Config.MATCH, ...Config.TEAM_SCOPED] },
  { code: "persons", route: "admin/persons", icon: "uugds-account", ready: true, profileList: [...Config.CONTENT, ...Config.TEAM_SCOPED] },
  { code: "players", route: "admin/players", icon: "uugds-account-multi", ready: true, profileList: [...Config.CONTENT, ...Config.TEAM_SCOPED] },
  { code: "coaches", route: "admin/coaches", icon: "uugds-account-badge", ready: true, profileList: [...Config.CONTENT, ...Config.TEAM_SCOPED] },
  { code: "articles", route: "admin/articles", icon: "uugdsstencil-communication-megaphone", ready: true, profileList: Config.NEWS },
  { code: "galleries", route: "admin/galleries", icon: "uugds-image-multi", ready: true, profileList: Config.GALLERY },
  { code: "files", route: "admin/files", icon: "uugds-document-multi", ready: true, profileList: Config.PAGES },
  { code: "identities", route: "admin/identities", icon: "uugds-shield-check", ready: true, profileList: Config.ADMIN },
  { code: "config", route: "admin/config", icon: "uugds-settings", ready: true, profileList: Config.ADMIN },
].filter((item) => item.ready);

// Role, která otevře aspoň jednu obrazovku administrace — podle ní se rozhoduje, jestli
// se položka „Administrace" v liště vůbec nabídne.
const ANY_ADMIN_PROFILE = [...new Set(ADMIN_MENU.flatMap((item) => item.profileList))];

export { ADMIN_MENU, ANY_ADMIN_PROFILE };
