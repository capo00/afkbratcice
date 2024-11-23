//@@viewOn:imports
import { createVisualComponent, Lsi, useContentSize, useMemo, Utils } from "uu5g05";
import { UuDate } from "uu_i18ng01";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements from "uu5g05-elements";
import Uu5TilesElements from "uu5tilesg02-elements";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { MatchProvider } from "./match-context";
import FormTeamSelect from "../team/form-team-select";
import { SeasonProvider } from "../season/season-context";
import FormSeasonSelect from "../season/form-season-select";
import { TeamProvider } from "../team/team-context";
import SeasonText from "../season/season-text";
import TeamItem from "../team/team-item";
import MatchResult from "./match-result";
//@@viewOff:imports

//@@viewOn:constants
const today = new UuDate();
const month = today.getMonth();
const year = today.getYear();

let matchDateRange;
if (month > 2 && month < 8)
  matchDateRange = [new UuDate([year, 1, 1]).toIsoString(), new UuDate([year, 7, 31]).toIsoString()];
else if (month >= 8)
  matchDateRange = [new UuDate([year, 8, 1]).toIsoString(), new UuDate([year, 12, 31]).toIsoString()];
else matchDateRange = [new UuDate([year - 1, 8, 1]).toIsoString(), new UuDate([year - 1, 12, 31]).toIsoString()];

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
    columnProps: { maxWidth: 112 },
    sort: true,
    input: {
      Component: Uu5Forms.FormTextSelect,
      props: { itemList: Array.from({ length: 15 }, (_, i) => ({ value: i + 1, text: i + 1 + "" })) },
    },
  },
  time: {
    label: { cs: "Datum a čas" },
    output(value, item) {
      return <Uu5Elements.DateTime value={value} format="(dd) D. M. YYYY HH:mm" />;
    },
    columnProps: { maxWidth: "max-content", horizontalAlignment: "right" },
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
    visible: false,
    columnProps: { maxWidth: "max-content" },
    input: {
      Component: Uu5Forms.FormText,
    },
  },
  departureTime: {
    label: { cs: "Čas odjezdu" },
    visible: false,
    columnProps: { maxWidth: 136 },
    input: {
      Component: Uu5Forms.FormTime,
    },
  },
  homeTeamId: {
    label: { cs: "Domácí" },
    output(value, item) {
      return <TeamItem id={value} />;
    },
    columnProps: {}, // must be here empty, because of full width of table
    input: {
      Component: FormTeamSelect,
      props: { required: true, compareKey: "guestTeamId" },
    },
    filterProps: {
      label: { cs: "Tým" },
      filter: (itemValue, value, item) => {
        return itemValue === value || item.data.guestTeamId === value;
      },
      inputType: FormTeamSelect,
      // inputProps: { name: "team" }, // TODO exists inputProps in filterProps? necessary to change name for this because of duplicity during opening filter
    },
  },
  guestTeamId: {
    label: { cs: "Hosté" },
    output(value, item) {
      return <TeamItem id={value} />;
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
    columnProps: { maxWidth: "s", label: { cs: "Výsledek" } },
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

function MatchRow(props) {
  //@@viewOn:private
  const { data: { data = {} } = {}, ...restProps } = props;
  const { componentProps, elementProps } = Utils.VisualComponent.splitProps(restProps);
  // console.log("MatchRow", data, componentProps);
  //@@viewOff:private

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:render
  return (
    <Uu5Elements.Grid templateColumns="1fr max-content">
      {({ style }) => (
        <td>
          <div {...elementProps} className={Utils.Css.joinClassName(elementProps.className, Config.Css.css(style))}>
            <Uu5Elements.Grid.Item
              colSpan={2}
              className={Config.Css.css({ display: "flex", justifyContent: "space-between" })}
            >
              <span>{data.round ? `${data.round}. kolo` : "Přátelský"}</span>
              <Uu5Elements.DateTime value={data.time} format="(dd) D. M. YYYY" />
            </Uu5Elements.Grid.Item>
            <TeamItem id={data.homeTeamId} />
            <Uu5Elements.Grid.Item rowSpan={2}>
              {data.homeGoals == null ? (
                <Uu5Elements.DateTime value={data.time} dateFormat="none" />
              ) : (
                <MatchResult data={data} />
              )}
            </Uu5Elements.Grid.Item>
            <TeamItem id={data.guestTeamId} />
          </div>
        </td>
      )}
    </Uu5Elements.Grid>
  );
  //@@viewOff:render
}

function getSeriesListXs(seriesList) {
  return seriesList.map(({ ...series }) => {
    if (series.value !== "homeTeamId") series.visible = false;
    return series;
  });
}
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
    const { teamId, seasonId, ...restProps } = props;

    const dtoIn = useMemo(() => {
      const result = {};
      if (teamId) result.teamId = teamId;
      if (seasonId) result.seasonId = seasonId;
      return result;
    }, [teamId, seasonId]);

    const contentSize = useContentSize();
    const isSmall = ["xs", "s"].includes(contentSize);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <TeamProvider>
        <SeasonProvider>
          <MatchProvider dtoIn={dtoIn}>
            {(dataList) => (
              <OcElements.Crud
                key={isSmall}
                header={<Lsi lsi={{ cs: "Zápasy" }} />}
                {...restProps}
                dataList={dataList}
                seriesList={isSmall ? getSeriesListXs(seriesList) : seriesList}
                columnList={
                  isSmall
                    ? columnList.map((col) => (col.value === "homeTeamId" ? { ...col, cellComponent: MatchRow } : col))
                    : columnList
                }
                sorterDefinitionList={sorterList}
                initialSorterList={[
                  { key: "time", ascending: true },
                  { key: "round", ascending: true },
                ]}
                filterDefinitionList={filterList}
                initialFilterList={teamId ? undefined : [{ key: "time", value: matchDateRange }]}
                onPreSubmit={async (e) => {
                  delete e.data.value.age;
                }}
                spacing={isSmall && !restProps.readOnly ? "tight" : undefined}
                viewType="table"
                hideHeader={isSmall}
                compact={isSmall}
                displaySeriesButton={!isSmall}
                borderRadius={isSmall ? "none" : undefined}
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
