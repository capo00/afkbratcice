const APP_NAME = "AFK";
const CSS_NAME = APP_NAME.toLowerCase();

const Cfg = {
  app: (name) => (`${APP_NAME}.${name}`),
  css: (name) => (`${CSS_NAME}-${name}`),

  CCR_MENU: "Menu"
};

export default Cfg;
