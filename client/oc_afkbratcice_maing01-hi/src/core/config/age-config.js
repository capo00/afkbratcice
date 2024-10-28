import Uu5Forms from "uu5g05-forms";
import Config from "./config";

export default {
  label: { cs: "Kategorie" },
  output: (value, item) => Config.AGE_MAP[value].name,
  columnProps: { maxWidth: 140 },
  sort: (a, b) => {
    const keys = Object.keys(Config.AGE_MAP);
    return keys.indexOf(a) - keys.indexOf(b);
  },
  filterProps: {
    filter: (itemValue, value) => itemValue?.every?.((v) => value.includes(v)),
    inputType: "text-select",
    inputProps: {
      multiple: true,
      itemList: Object.entries(Config.AGE_MAP).map(([age, { name }]) => ({ value: age, children: name })),
    },
  },
  input: {
    Component: Uu5Forms.FormSwitchSelect,
    props: {
      required: true,
      itemList: Object.entries(Config.AGE_MAP).map(([age, { name }]) => ({ value: age, children: name })),
      initialValue: "men",
    },
  },
};
