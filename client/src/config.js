import * as UU5 from "uu5g04";

const APP_NAME = "AFK";
const CSS_NAME = APP_NAME.toLowerCase();

const Cfg = {
  app: (name) => (`${APP_NAME}.${name}`),
  css: (name) => (`${CSS_NAME}-${name}`),

  CCR_MENU: "Menu",

  MEN: "M",
  OLD_GUARDS: "OG",

  DAYS: ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"],

  route: (newRoute) => UU5.Environment.getRouter().setRoute(newRoute)
};

Cfg.TEAMS = {};
Cfg.TEAMS[Cfg.MEN] = {
  name: "Muži"
};
Cfg.TEAMS[Cfg.OLD_GUARDS] = {
  name: "Stará garda"
};

export default Cfg;
