//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { SeasonProvider } from "./season-context";
import { TeamProvider } from "../team/team-context";
import ageConfig from "../config/age-config";
import FormTeamSelect from "../team/form-team-select";
import TeamItem from "../team/team-item";
//@@viewOff:imports

//@@viewOn:constants
const COMPETITION_LIST = ["IV. třída", "III. třída", "Okresní přebor"];

function TeamItems({ itemList }) {
  return (
    <>
      {itemList?.map?.((id) => (
        <div key={id} className={Config.Css.css({ "& + &": { marginTop: 8 } })}>
          <TeamItem id={id} />
        </div>
      ))}
    </>
  );
}

const CONFIG = {
  age: ageConfig,
  competition: {
    label: { cs: "Soutěž" },
    columnProps: { maxWidth: 160 },
    sort: (a, b) => COMPETITION_LIST.indexOf(a) - COMPETITION_LIST.indexOf(b),
    filterProps: {
      filter: (itemValue, value) => itemValue?.every?.((v) => value.includes(v)),
      inputType: "text-select",
      inputProps: {
        multiple: true,
        itemList: COMPETITION_LIST.map((value) => ({ value })),
      },
    },
    input: {
      Component: Uu5Forms.FormSelect,
      props: {
        itemList: COMPETITION_LIST.map((value) => ({ value })),
        required: true,
      },
    },
  },
  yearFrom: {
    label: { cs: "Rok" },
    columnProps: { maxWidth: "min-content" },
    sort: true,
    filterProps: {
      filter: (itemValue, value) => itemValue >= value[0] && itemValue <= value[1],
      inputType: "year-range",
    },
    input: {
      Component: Uu5Forms.FormYear,
      props: {
        initialValue: new Date().getFullYear().toString(),
        required: true,
      },
    },
  },
  teamList: {
    label: { cs: "Týmy" },
    output: (value, item) => <TeamItems itemList={value} />,
    columnProps: { maxWidth: 264 },
    input: {
      Component: FormTeamSelect,
      props: {
        multiple: true,
      },
    },
  },
  desc: {
    label: { cs: "Popis" },
    input: {
      Component: Uu5Forms.FormTextArea,
    },
  },
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CONFIG);
//@@viewOff:helpers

const SeasonCrud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SeasonCrud",
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
        <SeasonProvider>
          {(dataList) => (
            <OcElements.Crud
              header={<Lsi lsi={{ cs: "Sezóny" }} />}
              {...props}
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
            >
              {() => (
                <Uu5Forms.Form.View
                  gridLayout={{
                    xs: "competition competition, yearFrom age, desc desc, teamList teamList",
                    s: "age age competition competition yearFrom, desc desc desc desc desc, teamList teamList teamList teamList teamList",
                  }}
                >
                  {OcElements.Crud.generateInputs(CONFIG)}
                </Uu5Forms.Form.View>
              )}
            </OcElements.Crud>
          )}
        </SeasonProvider>
      </TeamProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SeasonCrud };
export default SeasonCrud;
//@@viewOff:exports
