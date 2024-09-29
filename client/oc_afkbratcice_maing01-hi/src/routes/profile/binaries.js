//@@viewOn:imports
import { Utils, createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5ImagingTools from "uu5imagingg01-tools";
import Uu5TilesElements from "uu5tilesg02-elements";
import Config from "../config/config.js";
import * as OcElements from "../../libs/oc_cli-elements";
import * as OcApp from "../../libs/oc_cli-app";
import Calls from "../../calls";
//@@viewOff:imports

//@@viewOn:constants
const CALLS = {
  load: (dtoIn) => OcApp.Call.cmdGet(Calls.getCommandUri("binary/list"), dtoIn),
  createItem: (dtoIn) => OcApp.Call.cmdPost(Calls.getCommandUri("binary/create"), dtoIn),
  updateItem: (dtoIn) => OcApp.Call.cmdPost(Calls.getCommandUri("binary/update"), dtoIn),
  deleteItem: (dtoIn) => OcApp.Call.cmdPost(Calls.getCommandUri("binary/delete"), dtoIn),
};

const vars = {
  name: {
    label: { cs: "Název" },
  },
  file: {
    label: { cs: "Soubor" },
  },
  size: {
    label: { cs: "Velikost" },
  },
  mts: {
    label: { cs: "Datum" },
  },
  tagList: {
    label: { cs: "Tagy" },
  },
  type: {
    label: { cs: "Typ" },
  },
};

for (let k in vars) vars[k].value ||= k;

const TAGS = {
  sys: "grey",
};

function Bytes({ value, roundingPosition = -1 }) {
  const UNITS = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte", "petabyte"];
  let unit, finalValue;

  if (!+value) {
    unit = UNITS[0];
    finalValue = 0;
  } else {
    const k = 1024;

    const i = Math.floor(Math.log(value) / Math.log(k));
    unit = UNITS[i];
    finalValue = value / Math.pow(k, i);
  }

  return <Uu5Elements.Number value={finalValue} unit={unit} roundingPosition={roundingPosition} />;
}

const SERIES_LIST = [
  {
    ...vars.file,
    dataItem: (item) => {
      let result;
      if (item.data.data.uri) {
        const type = item.data.data.mimeType;
        if (type.startsWith("image")) {
          result = <img src={item.data.data.uri} alt={item.data.data.name} height={32} referrerPolicy="no-referrer" />;
        } else {
          result = <Uu5Elements.Link href={item.data.data.uri} download={item.data.data.name} />;
        }
      }

      return result;
    },
  },
  vars.name,
  {
    ...vars.size,
    dataItem: (item) => <Bytes value={item.data.data[vars.size.value]} />,
  },
  {
    ...vars.mts,
    dataItem: (item) => <Uu5Elements.DateTime value={item.data.data.sys.mts} />,
  },
  {
    ...vars.tagList,
    dataItem: (item) => (
      <>
        {item.data.data[vars.tagList.value]?.map?.((tag) => (
          <Uu5Elements.Badge key={tag} colorScheme={TAGS[tag]} size="xl">
            {tag}
          </Uu5Elements.Badge>
        ))}
      </>
    ),
  },
];

const COLUMN_LIST = [
  { value: vars.file.value, maxWidth: "m" },
  { value: vars.name.value, headerComponent: <Uu5TilesElements.Table.HeaderCell sorterKey={vars.name.value} /> },
  {
    value: vars.size.value,
    maxWidth: "m",
    headerComponent: <Uu5TilesElements.Table.HeaderCell horizontalAlignment="right" sorterKey={vars.size.value} />,
    cellComponent: (props) => <Uu5TilesElements.Table.Cell {...props} horizontalAlignment="right" />,
  },
  {
    value: vars.mts.value,
    maxWidth: "m",
    headerComponent: <Uu5TilesElements.Table.HeaderCell sorterKey={vars.mts.value} />,
  },
  { value: vars.tagList.value },
];

const SORTER_LIST = [
  {
    key: vars.name.value,
    label: vars.name.label,
    sort: (a, b) => a.data[vars.name.value].localeCompare(b.data[vars.name.value]),
  },
  {
    key: vars.size.value,
    label: vars.size.label,
    sort: (a, b) => a.data[vars.size.value] - b.data[vars.size.value],
  },
  {
    key: vars.mts.value,
    label: vars.mts.label,
    sort: (a, b) => a.data.sys[vars.mts.value].localeCompare(b.data.sys[vars.mts.value]),
  },
];

const FILTER_LIST = [
  {
    key: vars.tagList.value,
    label: vars.tagList.label,
    filter: (item, value) => {
      if (!value) return true;
      return item.data[vars.tagList.value]?.every?.((v) => value.includes(v));
    },
    inputType: "text-select",
    inputProps: {
      multiple: true,
      itemList: Object.keys(TAGS).map((tag) => ({ value: tag, colorScheme: TAGS[tag] })),
    },
  },
];
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Binaries = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Binaries",
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
            header={<Lsi lsi={{ cs: "Soubory" }} />}
            headerType="heading"
            calls={CALLS}
            seriesList={SERIES_LIST}
            columnList={COLUMN_LIST}
            sorterDefinitionList={SORTER_LIST}
            filterDefinitionList={FILTER_LIST}
            onPreSubmit={async (e) => {
              const f = e.data.value[vars.file.value];
              if (f) {
                const { imageFile } = await Uu5ImagingTools.Adjustment.resizeMax(f, 2048);
                const { imageFile: file } = await Uu5ImagingTools.Adjustment.changeType(imageFile, "webp", 0.75);
                e.data.value[vars.file.value] = new File([file], file.name, {
                  type: file.type,
                  lastModified: f.lastModified,
                });
              }
            }}
          >
            {({ type }) => (
              <Uu5Forms.Form.View gridLayout={{ xs: "name, file, tagList", s: "name file, tagList tagList" }}>
                <Uu5Forms.FormText name={vars.name.value} label={vars.name.label} />
                <Uu5Forms.FormFile name={vars.file.value} label={vars.file.label} required={type === "create"} />
                <Uu5Forms.FormTextSelect
                  name={vars.tagList.value}
                  label={vars.tagList.label}
                  multiple
                  itemList={Object.keys(TAGS).map((tag) => ({
                    value: tag,
                    colorScheme: TAGS[tag],
                  }))}
                />
              </Uu5Forms.Form.View>
            )}
          </OcElements.Crud>
        </main>
      );
      //@@viewOff:render
    },
  }),
  { profileList: ["operatives"] },
);

//@@viewOn:exports
export { Binaries };
export default Binaries;
//@@viewOff:exports
