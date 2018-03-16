import * as UU5 from "uu5g04";
import Cfg from "../config.js";

const MODULE_NAME = "Bricks";
const CSS_NAME = MODULE_NAME.toLowerCase();

const Config = UU5.Common.Tools.merge({}, Cfg, {
  app: (name) => (Cfg.app(`${MODULE_NAME}.${name}`)),
  css: (name) => (Cfg.css(`${CSS_NAME}-${name}`))
});

export default Config;
