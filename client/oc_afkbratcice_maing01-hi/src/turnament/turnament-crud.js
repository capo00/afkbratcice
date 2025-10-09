//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements from "uu5g05-elements";
import OcAuth from "../libs/oc_cli-auth";
import Config from "./config/config.js";
import OcElements from "../libs/oc_cli-elements";
import { TurnamentProvider } from "./turnament-context";
//@@viewOff:imports

//@@viewOn:constants
const TYPE_MAP = {
  footbal: <Lsi lsi={{ cs: "Fotbal" }} />,
  futnet: <Lsi lsi={{ cs: "Nohejbal" }} />,
  "ping-pong": <Lsi lsi={{ cs: "Ping-pong" }} />,
  "darts": <Lsi lsi={{ cs: "Šipky" }} />,
};

const CONFIG = {
  name: {
    label: { cs: "Název" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      props: { required: true },
    },
    output: (value, item) => (
      <Uu5Elements.Link href={"turnament/detail?id=" + item.data.id}>{value}</Uu5Elements.Link>
    ),
  },
  date: {
    label: { cs: "Datum" },
    sort: true,
    input: {
      Component: Uu5Forms.FormDate,
      props: { required: true },
    },
    output: (value) => <Uu5Elements.DateTime value={value} timeFormat="none" />,
  },
  owner: {
    label: { cs: "Vlastník" },
  },
  state: {
    label: { cs: "Stav" },
  },
  type: {
    label: { cs: "Typ" },
    input: {
      Component: Uu5Forms.FormSelect,
      props: {
        required: true,
        itemList: Object.entries(TYPE_MAP).map(([key, children]) => ({
          value: key, children
        })),
      },
    },
    output: (value) => TYPE_MAP[value],
  },
  desc: {
    label: { cs: "Popis" },
    input: {
      Component: Uu5Forms.FormTextArea,
    },
  },
  groupList: {
    label: { cs: "Skupiny" },
    input: {
      Component: Uu5Forms.FormText,
    },
    output: (value) => value?.join?.(", "),
  },
  placeList: {
    label: { cs: "Hřiště" },
    input: {
      Component: Uu5Forms.FormText,
    },
    output: (value) => value?.join?.(", "),
  },
  teamList: {
    label: { cs: "Týmy" },
    output: (value) => value?.map(({ name }) => name)?.join?.(", "),
  },
  operativeList: {
    label: { cs: "Operátoři" },
    input: {
      Component: Uu5Forms.FormText,
    },
    output: (value) => value?.join?.(", "),
  },
  refereeList: {
    label: { cs: "Rozhodčí" },
    input: {
      Component: Uu5Forms.FormText,
    },
    output: (value) => value?.join?.(", "),
  },
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CONFIG);
//@@viewOff:helpers

const TurnamentCrud = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TurnamentCrud",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const session = OcAuth.useSession();
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    return (
      <TurnamentProvider>
        {(dataList) => (
          <OcElements.Crud
            header={<Lsi lsi={{ cs: "Turnaje" }} />}
            {...props}
            dataList={dataList}
            seriesList={seriesList}
            columnList={columnList}
            sorterDefinitionList={sorterList}
            filterDefinitionList={filterList}
            onPreSubmit={async (e) => {
              const data = e.data.value;
              if (data.groupList) data.groupList = data.groupList.split(/, ?/);
              if (data.placeList) data.placeList = data.placeList.split(/, ?/);
              if (data.operativeList) data.operativeList = data.operativeList.split(/, ?/);
              if (data.refereeList) data.refereeList = data.refereeList.split(/, ?/);
              data.owner = session.identity.identity;
              data.state = "initial";
            }}
          >
            {({ data }) => {
              const gridLayout = {
                xs: "name, date, desc, groupList, placeList, operativeList, refereeList",
                s: "name date, desc groupList, desc placeList, operativeList refereeList",
              };

              if (!data || data.state === "initial") {
                gridLayout.xs = "type, " + gridLayout.xs;
                gridLayout.s = "type ., " + gridLayout.s;
              }

              return (
                <Uu5Forms.Form.View gridLayout={gridLayout}>
                  {OcElements.Crud.generateInputs(CONFIG)}
                </Uu5Forms.Form.View>
              );
            }}
          </OcElements.Crud>
        )}
      </TurnamentProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TurnamentCrud };
export default TurnamentCrud;
//@@viewOff:exports
