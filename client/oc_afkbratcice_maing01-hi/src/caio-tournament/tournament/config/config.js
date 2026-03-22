import { Utils, Lsi } from "uu5g05";
import Config from "../../config/config.js";

const TAG = Config.TAG + "Tournament.";

const Cfg = {
  ...Config,

  TAG,
  Css: Utils.Css.createCssModule(
    TAG.replace(/\.$/, "")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z-]/g, ""),
    process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION,
  ),

  TYPE_MAP: {
    football: { children: <Lsi lsi={{ cs: "Fotbal" }} /> },
    "ping-pong": { children: <Lsi lsi={{ cs: "Ping-pong" }} /> },
    darts: { children: <Lsi lsi={{ cs: "Šipky" }} /> },
    nohejbal: { children: <Lsi lsi={{ cs: "Nohejbal" }} /> },
  },

  STATE_MAP: {
    created: { icon: "uubmlstencil-states-s02", colorScheme: "initial", children: <Lsi lsi={{ cs: "Vytvořen" }} /> },
    group: { icon: "uubmlstencil-states-s10", colorScheme: "active", children: <Lsi lsi={{ cs: "Hraje se" }} /> },
    playoff: { icon: "uubmlstencil-states-s14", colorScheme: "active", children: <Lsi lsi={{ cs: "Play-off" }} /> },
    completed: { icon: "uubmlstencil-states-s06", colorScheme: "active", children: <Lsi lsi={{ cs: "Dohráno" }} /> },
    final: { icon: "uubmlstencil-states-s25", colorScheme: "final", children: <Lsi lsi={{ cs: "Uzavřen" }} /> },
  },
};

Cfg.TYPE_ITEM_LIST = Object.entries(Cfg.TYPE_MAP).map(([value, { children }]) => ({ value, children }));
Cfg.STATE_ITEM_LIST = Object.entries(Cfg.STATE_MAP).map(([value, { children }]) => ({ value, children }));

export default Cfg;