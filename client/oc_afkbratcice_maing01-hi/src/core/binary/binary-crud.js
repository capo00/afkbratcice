//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5ImagingTools from "uu5imagingg01-tools";
import Config from "../config/config.js";
import * as OcElements from "../../libs/oc_cli-elements";
import FormFile from "../form-file";
import { BinaryProvider } from "./binary-context";
//@@viewOff:imports

//@@viewOn:constants
const TAGS = {
  sys: "grey",
  team: "green",
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

const CONFIG = {
  file: {
    label: { cs: "Soubor" },
    output: (value, item) => {
      let result;
      if (item.data.uri) {
        const type = item.data.mimeType;
        if (type.startsWith("image")) {
          result = <OcElements.Image src={item.data.uri} alt={item.data.name} height={32} />;
        } else {
          result = <Uu5Elements.Link href={item.data.uri} download={item.data.name} />;
        }
      }

      return result;
    },
    columnProps: { maxWidth: "m" },
    input: {
      Component: FormFile,
      props: ({ operation }) => ({ required: operation === "create" }),
    },
  },
  name: {
    label: { cs: "Název" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
    },
  },
  size: {
    label: { cs: "Velikost" },
    output: (value) => <Bytes value={value} />,
    columnProps: {
      maxWidth: "m",
      horizontalAlignment: "right",
    },
    sort: true,
  },
  mts: {
    label: { cs: "Datum" },
    output: (value, item) => <Uu5Elements.DateTime value={item.data.sys.mts} />,
    sort: (_, __, a, b) => a.data.sys.mts.localeCompare(b.data.sys.mts),
  },
  tagList: {
    label: { cs: "Tagy" },
    output: (value) => (
      <>
        {value?.map?.((tag) => (
          <Uu5Elements.Badge
            key={tag}
            colorScheme={TAGS[tag] ?? "building"}
            size="xl"
            className={Config.Css.css({ marginInlineEnd: 4, marginBlockEnd: 4 })}
          >
            {tag}
          </Uu5Elements.Badge>
        ))}
      </>
    ),
    filterProps: {
      filter: (itemValue, value) => {
        return itemValue?.every?.((v) => value.includes(v));
      },
      inputType: "text-select",
      inputProps: {
        multiple: true,
        itemList: Object.keys(TAGS).map((tag) => ({ value: tag, colorScheme: TAGS[tag] })),
      },
    },
    input: {
      Component: Uu5Forms.FormTextSelect,
      props: {
        multiple: true,
        itemList: Object.keys(TAGS).map((tag) => ({
          value: tag,
          colorScheme: TAGS[tag] ?? "building",
        })),
        insertable: true,
      },
    },
  },
  mimeType: {
    label: { cs: "Typ" },
  },
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CONFIG);
//@@viewOff:helpers

const BinaryCrud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "BinaryCrud",
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
    return (
      <BinaryProvider>
        {(dataList) => (
          <OcElements.Crud
            header={<Lsi lsi={{ cs: "Soubory" }} />}
            headerType="heading"
            {...props}
            dataList={dataList}
            seriesList={seriesList}
            columnList={columnList}
            sorterDefinitionList={sorterList}
            filterDefinitionList={filterList}
            onPreSubmit={async (e) => {
              const origFile = e.data.value.file;
              if (origFile) {
                let file = origFile;
                if (origFile.type?.startsWith("image")) {
                  const { imageFile } = await Uu5ImagingTools.Adjustment.resizeMax(origFile, 2048);
                  const { imageFile: webpFile } = await Uu5ImagingTools.Adjustment.changeType(imageFile, "webp", 0.75);
                  file = webpFile;
                }
                e.data.value.file = new File([file], file.name, {
                  type: file.type,
                  lastModified: origFile.lastModified,
                });
              }
            }}
          >
            {({ type }) => (
              <Uu5Forms.Form.View gridLayout={{ xs: "name, file, tagList", s: "name file, tagList tagList" }}>
                {OcElements.Crud.generateInputs(CONFIG, type)}
              </Uu5Forms.Form.View>
            )}
          </OcElements.Crud>
        )}
      </BinaryProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { BinaryCrud };
export default BinaryCrud;
//@@viewOff:exports
