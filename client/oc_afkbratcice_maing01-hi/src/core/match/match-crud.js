//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { MatchProvider } from "./match-context";
import FormTeamSelect from "../team/form-team-select";
import TeamLink from "../team/team-link";
import { SeasonProvider } from "../season/season-context";
import FormSeasonSelect from "../season/form-season-select";
import { TeamProvider } from "../team/team-context";
import SeasonText from "../season/season-text";
//@@viewOff:imports

//@@viewOn:constants
const CONFIG = {
  seasonId: {
    label: { cs: "Sezóna" },
    output(value, item) {
      return <SeasonText id={value} />;
    },
    columnProps: { maxWidth: "max-content" },
    input: {
      Component: FormSeasonSelect,
      props: { required: true },
    },
  },
  round: {
    label: { cs: "Kolo" },
    columnProps: { maxWidth: "xs" },
    input: {
      Component: Uu5Forms.FormTextSelect,
      props: { itemList: Array.from({ length: 15 }, (_, i) => ({ value: i + 1, text: i + 1 + "" })) },
    },
  },
  time: {
    label: { cs: "Datum a čas" },
    output(value, item) {
      return <Uu5Elements.DateTime value={value} />;
    },
    columnProps: { maxWidth: "max-content" },
    sort: true,
    filterProps: {
      label: { cs: "Datum od - do" },
      filter: (itemValue, value) => {
        // range
        let [start, end] = value;
        end += "T23:59:59.999Z";
        return itemValue >= start && itemValue <= end;
      },
      inputType: "date-range",
    },
    input: {
      Component: Uu5Forms.FormDateTime,
    },
  },
  place: {
    label: { cs: "Místo" },
    columnProps: { maxWidth: "max-content" },
    input: {
      Component: Uu5Forms.FormText,
    },
  },
  departureTime: {
    label: { cs: "Čas odjezdu" },
    columnProps: { maxWidth: 136 },
    input: {
      Component: Uu5Forms.FormTime,
    },
  },
  homeTeamId: {
    label: { cs: "Domácí" },
    output(value, item) {
      return <TeamLink id={value} />;
    },
    columnProps: {}, // must be here empty, because of full width of table
    input: {
      Component: FormTeamSelect,
      props: { required: true, compareKey: "guestTeamId" },
    },
  },
  guestTeamId: {
    label: { cs: "Hosté" },
    output(value, item) {
      return <TeamLink id={value} />;
    },
    columnProps: {}, // must be here empty, because of full width of table
    input: {
      Component: FormTeamSelect,
      props: { required: true, compareKey: "homeTeamId" },
    },
  },
  homeGoals: {
    label: { cs: "Góly domácích" },
    output(value, item) {
      let result;
      if (value != null) {
        result = [value, item.data.guestGoals].join(":");

        if (item.data.homeGoalsHalf) {
          result += ` (${[item.data.homeGoalsHalf, item.data.guestGoalsHalf].join(":")})`;
        }
      }
      return result;
    },
    columnProps: { maxWidth: "xs", label: { cs: "Góly" } },
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 0 },
    },
  },
  guestGoals: {
    label: { cs: "Góly hostů" },
    output: false,
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 0 },
    },
  },
  homeGoalsHalf: {
    label: { cs: "Poločas domácích" },
    output: false,
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 0 },
    },
  },
  guestGoalsHalf: {
    label: { cs: "Poločas hostů" },
    output: false,
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 0 },
    },
  },
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CONFIG);
//@@viewOff:helpers

const MatchCrud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchCrud",
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
          <MatchProvider>
            {(dataList) => (
              <OcElements.Crud
                header={<Lsi lsi={{ cs: "Zápasy" }} />}
                headerType="heading"
                {...props}
                dataList={dataList}
                seriesList={seriesList}
                columnList={columnList}
                sorterDefinitionList={sorterList}
                initialSorterList={[{ key: "time", ascending: true }]}
                filterDefinitionList={filterList}
                initialFilterList={[{ key: "time", value: ["2024-07-01", "2024-12-31"] }]}
                onPreSubmit={async (e) => {
                  delete e.data.value.age;
                }}
              >
                <Uu5Forms.Form.View
                  gridLayout={{
                    xs: "seasonId seasonId, round round, time time, homeTeamId homeTeamId, guestTeamId guestTeamId, place place, departureTime departureTime, homeGoals guestGoals, homeGoalsHalf guestGoalsHalf",
                    s: "seasonId seasonId time time, homeTeamId homeTeamId guestTeamId guestTeamId, round place place departureTime, homeGoals guestGoals homeGoalsHalf guestGoalsHalf",
                  }}
                >
                  {OcElements.Crud.generateInputs(CONFIG)}
                </Uu5Forms.Form.View>
              </OcElements.Crud>
            )}
          </MatchProvider>
        </SeasonProvider>
      </TeamProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchCrud };
export default MatchCrud;
//@@viewOff:exports
