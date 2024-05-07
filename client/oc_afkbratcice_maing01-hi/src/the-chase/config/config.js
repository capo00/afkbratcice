import { Utils } from "uu5g05";
import Config from "../../config/config.js";

const TAG = Config.TAG + "TheChase.";

const MIN = 60 * 1000;

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

  minMs: MIN,
  answerList: ["a", "b", "c"],
  round1DurationMs: MIN, // MIN
  round3DurationMs: 2 * MIN, // 2 * MIN
  round2Rate: process.env.NODE_ENV === "development" ? 2 : undefined,
};
