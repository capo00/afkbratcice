import ParentConfig from "../../config/config.js";

const TAG = ParentConfig.TAG + "Product.";

const CATEGORY_ITEM_LIST = [
  { value: "services", children: "Služby" },
  { value: "material", children: "Materiál" },
  { value: "wedding", children: "Svatba" },
  { value: "eyelash", children: "Řasy" },
  { value: "socialEvent", children: "Společenská akce" },
];

const SUB_CATEGORY_ITEM_LIST = [
  { value: "woman", children: "Žena" },
  { value: "man", children: "Muž" },
  { value: "child", children: "Dítě" },
  { value: "bride", children: "Nevěsta" },
  { value: "guest", children: "Host" },
  { value: "journey", children: "Cesta" },
];

export default {
  ...ParentConfig,
  TAG,
  CATEGORY_ITEM_LIST,
  SUB_CATEGORY_ITEM_LIST,
};
