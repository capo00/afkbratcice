//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5ImagingTools from "uu5imagingg01-tools";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import FormFile from "../form-file";
import { TeamProvider } from "./team-context";
import ageConfig from "../config/age-config";
//@@viewOff:imports

//@@viewOn:constants
const ADJUSTMENT_MAP = {
  optimal: "Optimální",
  original: "Originální",
};

const CONFIG = {
  logo: {
    label: { cs: "Logo", en: "Logo" },
    output(value, item) {
      return item.data.logoUri ? <OcElements.Image src={item.data.logoUri} alt="Logo" height={32} /> : undefined;
    },
    columnProps: { maxWidth: 84, minWidth: 84 },
    input: {
      Component: FormFile,
      props: { accept: "image/*" },
    },
  },
  name: {
    label: { cs: "Název" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      props: { required: true },
    },
  },
  age: ageConfig,
  adjustment: {
    label: { cs: "Velikost" },
    output: false,
    input: {
      Component: Uu5Forms.FormSwitchSelect,
      props: {
        itemList: Object.entries(ADJUSTMENT_MAP).map(([value, children]) => ({ value, children })),
        initialValue: Object.keys(ADJUSTMENT_MAP)[0],
      },
    },
  },
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CONFIG);
//@@viewOff:helpers

const TeamCrud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamCrud",
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
      <TeamProvider>
        {(dataList) => (
          <OcElements.Crud
            header={<Lsi lsi={{ cs: "Týmy" }} />}
            {...props}
            dataList={dataList}
            seriesList={seriesList}
            columnList={columnList}
            sorterDefinitionList={sorterList}
            filterDefinitionList={filterList}
            onPreSubmit={async (e) => {
              const origFile = e.data.value.logo;
              if (origFile) {
                let file = origFile;
                if (e.data.value.adjustment === "optimal") {
                  const { imageFile } = await Uu5ImagingTools.Adjustment.resizeMax(origFile, 400);
                  const { imageFile: webpFile } = await Uu5ImagingTools.Adjustment.changeType(imageFile, "webp", 0.75);
                  file = webpFile;
                }
                e.data.value.logo = new File([file], file.name, {
                  type: file.type,
                  lastModified: origFile.lastModified,
                });
              }
              delete e.data.value.adjustment;
              delete e.data.value.logoUri; // because of update, where is logoUri in teamObject
            }}
          >
            <Uu5Forms.Form.View gridLayout={{ xs: "name, age, logo", s: "name age, logo adjustment" }}>
              {OcElements.Crud.generateInputs(CONFIG)}
            </Uu5Forms.Form.View>
          </OcElements.Crud>
        )}
      </TeamProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamCrud };
export default TeamCrud;
//@@viewOff:exports
