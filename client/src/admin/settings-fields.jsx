import { createVisualComponent, useLsi, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { enumItemList, EntitySelect, categoryLabel } from "./fields.jsx";
import { SOCIAL_CODE_LIST, socialFieldName } from "./settings.js";

// Pole sekce klubu na obrazovce Nastavení (admin/settings.js). Hodnotu dostanou z `toForm` přes
// společný Form.Provider stacku, takže `initialValue` tu nemají. Do 2026-11 screens/config.jsx.

const LSI_PATH = ["admin", "config"];

const SP = (size) => Uu5Elements.UuGds.SpacingPalette.getValue(["fixed", size]);
const ONE_COLUMN = { xs: "minmax(0, 1fr)" };
// Krátká pole po dvou od `m` výš, na telefonu pod sebou.
const TWO_COLUMNS = { xs: "minmax(0, 1fr)", m: "repeat(2, minmax(0, 1fr))" };

const fieldLabel = (code) => <Lsi import={importLsi} path={["admin", "field", code]} />;

function GroupHeader({ children }) {
  return (
    <Uu5Elements.Text category="interface" segment="title" type="minor" elementAttrs={{ role: "heading", "aria-level": 3 }}>
      {children}
    </Uu5Elements.Text>
  );
}

const SettingsFields = createVisualComponent({
  uu5Tag: Config.TAG + "SettingsFields",

  render() {
    const lsi = useLsi(importLsi, LSI_PATH);

    return (
      <Uu5Elements.Grid rowGap={SP("e")} templateColumns={ONE_COLUMN}>
        <GroupHeader>{lsi.header}</GroupHeader>
        <Uu5Forms.FormTextArea name="notice" label={fieldLabel("notice")} maxLength={200} autoResize />
        <Uu5Forms.FormNumber
          name="founded"
          label={fieldLabel("founded")}
          min={1800}
          max={new Date().getFullYear()}
          step={1}
        />
        {/* Kódy kategorií (afk_category), ne věkové skupiny: v menu jsou mužstva. */}
        <EntitySelect
          name="categoryOrder"
          label={lsi.categoryOrder}
          useCase="/category/list"
          valueKey="code"
          getLabel={categoryLabel}
          multiple
        />
        <Uu5Forms.FormCheckboxes
          name="hideNamesAgeList"
          label={lsi.hideNames}
          itemList={enumItemList("age", Config.AGE_LIST)}
        />

        <GroupHeader>{lsi.contact}</GroupHeader>
        <Uu5Forms.FormText name="address" label={fieldLabel("address")} maxLength={200} />
        <Uu5Elements.Grid rowGap={SP("e")} columnGap={SP("d")} templateColumns={TWO_COLUMNS}>
          <Uu5Forms.FormEmail name="email" label={fieldLabel("email")} />
          <Uu5Forms.FormText name="phone" label={fieldLabel("phone")} maxLength={50} />
          <Uu5Forms.FormText name="ico" label={fieldLabel("ico")} maxLength={20} />
          <Uu5Forms.FormText name="gps" label={fieldLabel("gps")} placeholder="49.0759N, 16.4952E" maxLength={50} />
        </Uu5Elements.Grid>
        <Uu5Forms.FormText name="mapUrl" label={fieldLabel("mapUrl")} info={lsi.mapUrlInfo} maxLength={2000} />

        <GroupHeader>{lsi.socialList}</GroupHeader>
        {SOCIAL_CODE_LIST.map((code) => (
          <Uu5Forms.FormText
            key={code}
            name={socialFieldName(code)}
            label={Config.SOCIAL_LABEL[code]}
            info={lsi.socialInfo}
            maxLength={500}
          />
        ))}
      </Uu5Elements.Grid>
    );
  },
});

export default SettingsFields;
