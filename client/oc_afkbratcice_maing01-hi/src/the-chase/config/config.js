import { Utils } from "uu5g05";
import Config from "../../config/config.js";

const TAG = Config.TAG + "TheChase.";

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

  minMs: 60 * 1000,
  answerList: ["a", "b", "c", "d"],
};
