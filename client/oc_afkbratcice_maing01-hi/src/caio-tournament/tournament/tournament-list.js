import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import OcAuth from "../../libs/oc_cli-auth";
import { withRoute } from "../../libs/oc_cli-app";

const TYPE_MAP = {
  football: <Lsi lsi={{ cs: "Fotbal" }} />,
  "ping-pong": <Lsi lsi={{ cs: "Ping-pong" }} />,
  darts: <Lsi lsi={{ cs: "Šipky" }} />,
  nohejbal: <Lsi lsi={{ cs: "Nohejbal" }} />,
};

const CRUD_CONFIG = {
  name: {
    label: { cs: "Název" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      props: { required: true },
    },
    output: (value, item) => (
      <Uu5Elements.Link href={"caio-tournament/tournament?id=" + item.data.id}>{value}</Uu5Elements.Link>
    ),
  },
  type: {
    label: { cs: "Typ" },
    sort: true,
    input: {
      Component: Uu5Forms.FormSelect,
      props: {
        required: true,
        itemList: Object.entries(TYPE_MAP).map(([value, children]) => ({ value, children })),
      },
    },
    output: (value) => TYPE_MAP[value],
  },
  date: {
    label: { cs: "Datum" },
    sort: true,
    input: {
      Component: Uu5Forms.FormDate,
    },
    output: (value) => value ? <Uu5Elements.DateTime value={value} timeFormat="none" /> : null,
  },
  place: {
    label: { cs: "Místo" },
    input: {
      Component: Uu5Forms.FormText,
    },
  },
  desc: {
    label: { cs: "Popis" },
    input: {
      Component: Uu5Forms.FormTextArea,
    },
  },
  groupCount: {
    label: { cs: "Počet skupin" },
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 1 },
    },
  },
  advanceFromGroup: {
    label: { cs: "Postup ze skupiny" },
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 1 },
    },
  },
};

const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CRUD_CONFIG);

const CLOSED_CONFIG = {
  name: CRUD_CONFIG.name,
  type: CRUD_CONFIG.type,
  date: CRUD_CONFIG.date,
  place: CRUD_CONFIG.place,
};

const closedGenerated = OcElements.Crud.generate(CLOSED_CONFIG);

const [ActiveProvider] = OcElements.CrudContext.create("caio-tournament/tournament");
const [ClosedProvider] = OcElements.CrudContext.create("caio-tournament/tournament");

function ActiveTab(props) {
  const session = OcAuth.useSession();
  const isAuth = session.identity?.profileList?.includes("authorities");

  return (
    <ActiveProvider dtoIn={{ excludeState: "final" }}>
      {(dataList) => (
        <OcElements.Crud
          header={<Lsi lsi={{ cs: "Aktivní turnaje" }} />}
          {...props}
          dataList={dataList}
          seriesList={seriesList}
          columnList={columnList}
          sorterDefinitionList={sorterList}
          filterDefinitionList={filterList}
          readOnly={!isAuth}
        >
          {({ type }) => {
            let cfg = CRUD_CONFIG;
            const gridLayout = {
              xs: "name, type, date, place, desc, groupCount, advanceFromGroup",
              s: "name type, date place, desc desc, groupCount advanceFromGroup",
            };

            if (type === "update") {
              const { type: _t, groupCount, advanceFromGroup, ...restCfg } = CRUD_CONFIG;
              cfg = restCfg;
              gridLayout.xs = "name, date, place, desc";
              gridLayout.s = "name date, place ., desc desc";
            }

            return (
              <Uu5Forms.Form.View gridLayout={gridLayout}>
                {OcElements.Crud.generateInputs(cfg)}
              </Uu5Forms.Form.View>
            );
          }}
        </OcElements.Crud>
      )}
    </ActiveProvider>
  );
}

function ClosedTab() {
  return (
    <ClosedProvider dtoIn={{ state: "final" }}>
      {(dataList) => (
        <OcElements.Crud
          header={<Lsi lsi={{ cs: "Uzavřené turnaje" }} />}
          dataList={dataList}
          seriesList={closedGenerated.seriesList}
          columnList={closedGenerated.columnList}
          sorterDefinitionList={closedGenerated.sorterList}
          filterDefinitionList={closedGenerated.filterList}
          disableCreate
          disableUpdate
          disableDelete
        />
      )}
    </ClosedProvider>
  );
}

const TournamentList = createVisualComponent({
  uu5Tag: Config.TAG + "TournamentList",

  render(props) {
    return (
      <Uu5Elements.Tabs
        itemList={[
          {
            label: <Lsi lsi={{ cs: "Aktivní" }} />,
            children: <ActiveTab {...props} />,
          },
          {
            label: <Lsi lsi={{ cs: "Uzavřené" }} />,
            children: <ClosedTab />,
          },
        ]}
      />
    );
  },
});

export { TournamentList };
export default withRoute(TournamentList);
