import { createVisualComponent, Lsi, useState } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Uu5Elements from "uu5g05-elements";
import OcElements from "../../libs/oc_cli-elements";
import OcAuth from "../../libs/oc_cli-auth";
import Config from "./config/config.js";
import { withRoute } from "../../libs/oc_cli-app";
import { TournamentListProvider } from "./tournament-list-context.js";

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
    // FIXME B: does not work filtering!
    filterProps: {
      filter: (value, itemList) => itemList?.find?.((v) => value === v),
      inputType: "text-select",
      inputProps: {
        multiple: true,
        itemList: Config.TYPE_ITEM_LIST,
      },
    },
    input: {
      Component: Uu5Forms.FormSelect,
      props: {
        required: true,
        itemList: Config.TYPE_ITEM_LIST,
      },
    },
    output: (value) => Config.TYPE_MAP[value]?.children,
  },
  state: {
    label: { cs: "Stav" },
    sort: true,
    filterProps: {
      filter: (value, itemList) => itemList?.find?.((v) => value === v),
      inputType: "text-select",
      inputProps: {
        multiple: true,
        itemList: Config.STATE_ITEM_LIST,
      },
    },
    output: (value) => Config.STATE_MAP[value]?.children,
  },
  date: {
    label: { cs: "Datum" },
    sort: true,
    filterProps: {
      label: { cs: "Datum od - do" },
      filter: (itemValue, value) => {
        // range
        let [start, end] = value;
        return itemValue >= start && itemValue <= end;
      },
      inputType: "date-range",
    },
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
    visible: false,
  },
  operativeList: {
    label: { cs: "Operátoři" },
    filterProps: {
      filter: (value, searchValue) => {
        return value?.find?.((v) => v.includes(searchValue));
      },
      inputType: "text",
    },
    input: {
      Component: OcAuth.FormIdentitySelect,
      props: { multiple: true },
    },
    output: (value) => value?.join(", "),
  },
  groupCount: {
    label: { cs: "Skupiny" },
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 1, label: { cs: "Počet skupin" } },
    },
    columnProps: {
      maxWidth: 100,
    }
  },
  advanceFromGroup: {
    label: { cs: "Postupuje" },
    input: {
      Component: Uu5Forms.FormNumber,
      props: { min: 1, label: { cs: "Postup ze skupiny" } },
    },
    columnProps: {
      maxWidth: 100,
    },
  },
};

const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CRUD_CONFIG);

let TournamentList = createVisualComponent({
  uu5Tag: Config.TAG + "TournamentList",

  render(props) {
    const [activeTab, setActiveTab] = useState("active");

    const session = OcAuth.useSession();
    const isAuth = session.identity?.profileList?.includes("authorities");
    const isActive = activeTab === "active";

    return (
      <TournamentListProvider dtoIn={{ closed: !isActive }}>
        {(dataList) => (
          <>
            <Uu5Elements.Tabs
              itemList={[
                {
                  code: "active",
                  label: <Lsi lsi={{ cs: "Aktivní" }} />,
                },
                {
                  code: "final",
                  label: <Lsi lsi={{ cs: "Uzavřené" }} />,
                },
              ]}
              activeCode={activeTab}
              onChange={(e) => setActiveTab(e.data.activeCode)}
              type="line"
              className={Config.Css.css({ marginBottom: 32 })}
            />
            <OcElements.Crud
              header={isActive ? <Lsi lsi={{ cs: "Aktivní turnaje" }} /> : <Lsi lsi={{ cs: "Uzavřené turnaje" }} />}
              {...props}
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              filterDefinitionList={filterList}
              sorterDefinitionList={sorterList}
              initialSorterList={[{ key: "date", ascending: true }]}
              readOnly={!isAuth || !isActive}
              actionList={[{ icon: "uugds-reload", collapsedChildren: <Lsi lsi={{ cs: "Znovu načíst" }} />, onClick: () => dataList.handlerMap?.load() }]}
              onPreSubmit={(e) => {
                const operativeList = e.data.value.operativeList;
                if (operativeList) {
                  e.data.value.operativeList = operativeList.map((item) => item.value);
                }
              }}
            >
              {({ type }) => {
                let cfg = CRUD_CONFIG;
                const gridLayout = {
                  xs: "name, type, date, place, desc, groupCount, advanceFromGroup, operativeList",
                  s: "name type, date place, desc desc, groupCount advanceFromGroup, operativeList .",
                };

                if (type === "update") {
                  const { type: _t, groupCount, advanceFromGroup, ...restCfg } = CRUD_CONFIG;
                  cfg = restCfg;
                  gridLayout.xs = "name, operativeList, date, place, desc, groupCount, advanceFromGroup";
                  gridLayout.s = "name operativeList, date place, desc desc, groupCount advanceFromGroup";
                }

                return (
                  <Uu5Forms.Form.View gridLayout={gridLayout}>
                    {OcElements.Crud.generateInputs(cfg)}
                  </Uu5Forms.Form.View>
                );
              }}
            </OcElements.Crud>
          </>
        )}
      </TournamentListProvider>
    );
  },
});

TournamentList = withRoute(TournamentList, { profileList: ["authorities"] });

export { TournamentList };
export default TournamentList;
