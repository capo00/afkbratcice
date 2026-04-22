import { Utils } from "uu5g05";

const TAG = "CaioLenaVisage.";

export default {
  TAG,
  Css: Utils.Css.createCssModule(
    TAG.replace(/\.$/, "")
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z-]/g, ""),
    process.env.NAME + "/" + process.env.OUTPUT_NAME + "@" + process.env.VERSION,
  ),
};
