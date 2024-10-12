import { Utils } from "uu5g05";
import Config from "../../config/config.js";

const TAG = Config.TAG + "Core.";

export default {
  ...Config,

  TAG,
  Css: Utils.Css.createCssModule(
    TAG.replace(/\.$/, "")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z-]/g, ""),
    process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION, // this helps preserve proper order of styles among loaded libraries
  ),

  AGE_MAP: {
    old: { name: "Stará garda" },
    men: { name: "Muži" },
    u18: { name: "Starší dorost" },
    u16: { name: "Mladší dorost" },
    u14: { name: "Starší žáci" },
    u12: { name: "Mladší žáci" },
    u10: { name: "Starší přípravka" },
    u6: { name: "Mladší přípravka" },
  },
};
