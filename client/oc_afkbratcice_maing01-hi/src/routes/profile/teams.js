//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import * as OcElements from "../../libs/oc_cli-elements";
import * as OcApp from "../../libs/oc_cli-app";
import Calls from "../../calls";
//@@viewOff:imports

//@@viewOn:constants
const CALLS = {
  load: (dtoIn) => OcApp.Call.cmdGet(Calls.getCommandUri("team/list"), dtoIn),
  createItem: (dtoIn) => OcApp.Call.cmdPost(Calls.getCommandUri("team/create"), dtoIn),
  updateItem: (dtoIn) => OcApp.Call.cmdPost(Calls.getCommandUri("team/update"), dtoIn),
  deleteItem: (dtoIn) => OcApp.Call.cmdPost(Calls.getCommandUri("team/delete"), dtoIn),
};

const vars = {
  name: {
    label: { cs: "Název", en: "Name" },
  },
  logo: {
    value: "logoUri",
    label: { cs: "Logo", en: "Logo" },
  },
  age: {
    label: { cs: "Věková kategorie", en: "Age category" },
  },
};

for (let k in vars) vars[k].value ||= k;

const SERIES_LIST = [
  {
    ...vars.name,
    dataItem: (item) => item.data.data[vars.name.value],
  },
  {
    ...vars.logo,
    dataItem: (item) =>
      item.data.data[vars.logo.value] ? (
        <img src={item.data.data[vars.logo.value]} alt="Logo" height={32} />
      ) : undefined,
  },
  {
    ...vars.age,
    dataItem: (item) => item.data.data[vars.age.value],
  },
];

const COLUMN_LIST = [
  { value: vars.name.value },
  { value: vars.logo.value, maxWidth: "m" },
  { value: vars.age.value, maxWidth: "m" },
];
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Teams = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Teams",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {},
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      const attrs = Utils.VisualComponent.getAttrs(props);
      return (
        <main {...attrs}>
          <OcElements.Crud
            header="Týmy"
            headerType="heading"
            calls={CALLS}
            seriesList={SERIES_LIST}
            columnList={COLUMN_LIST}
          >
            <Uu5Forms.Form.View gridLayout={{ xs: "name, logoUri, age", s: "name logoUri, age age" }}>
              <Uu5Forms.FormText name={vars.name.value} label={vars.name.label} required />
              <Uu5Forms.FormFile name={vars.logo.value} label={vars.logo.label} />
              <Uu5Forms.FormSwitchSelect
                name={vars.age.value}
                label={vars.age.label}
                required
                itemList={[{ value: "adults", children: "Dospělí" }]}
                initialValue="adults"
              />
            </Uu5Forms.Form.View>
          </OcElements.Crud>
        </main>
      );
      //@@viewOff:render
    },
  }),
  { profileList: ["operatives"] },
);

//@@viewOn:exports
export { Teams };
export default Teams;
//@@viewOff:exports
