import { createVisualComponent, Lsi, useMemo } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../screen.jsx";
import { EnumText, boolField, enumItemList, personLabel } from "../fields.jsx";
import CrudFormView from "../crud-form-view.jsx";
import FormPersonSelect from "../form-person-select.jsx";
import { periodFields, useTeamTabs } from "../team-tabs.jsx";

// Vedení klubu: trenéři, asistenti a vedoucí týmů a výbor AFK (entita `management`).
//
// **Záznam = jedna osoba v jedné funkci v jednom období** (design/data-model.md, sekce 7):
// osoba, tým (bez týmu výbor), funkce, od, do. Obrazovka má záložku za každý náš tým a jednu
// za výbor; tabulka na záložce ukazuje, kdo v jaké funkci kdy byl, aktuální nahoře.
//
// Tým/výbor není pole formuláře: nový záznam ho dostane ze záložky (`calls.createItem`)
// a server ho u úpravy nemění -- jiný tým je jiná funkce.

const [ManagementProvider] = UiElements.CrudContext.create("management");
// Bez `createMany`/`deleteMany` -- `management` je na serveru nemá (caio-ui `CrudContext.entityCalls`).
const CALLS = UiElements.CrudContext.entityCalls("management");

const BOARD = "board";
const ERROR_LSI = lsi("errors");

const TEAM_ROLE_ITEM_LIST = enumItemList("teamRole", Config.TEAM_ROLE_LIST);
const BOARD_ROLE_ITEM_LIST = enumItemList("boardRole", Config.BOARD_ROLE_LIST);
const BOOL_ITEM_LIST = [true, false].map((value) => ({
  value,
  children: <Lsi import={importLsi} path={["admin", "bool", String(value)]} />,
}));

/**
 * Konfigurace tabulky a formuláře jedné záložky. Výbor má jiný číselník funkcí a navíc
 * „Kontakt na webu“; osoby do filtru jsou ty, které na záložce jsou.
 */
function getConfig({ board, personItemList }) {
  const enumName = board ? "boardRole" : "teamRole";
  const roleItemList = board ? BOARD_ROLE_ITEM_LIST : TEAM_ROLE_ITEM_LIST;
  const roleOrder = board ? Config.BOARD_ROLE_LIST : Config.TEAM_ROLE_LIST;
  const personText = (data) => (data?.person ? personLabel(data.person) : (data?.personId ?? ""));

  return {
    personId: {
      label: lsi("admin", "field", "person"),
      output: (value, item) => personText(item.data) || value,
      sort: (_, __, a, b) => personText(a.data).localeCompare(personText(b.data), "cs"),
      input: { Component: FormPersonSelect, props: { required: true } },
      filterProps: {
        inputType: "text-select",
        inputProps: { itemList: personItemList },
        filter: (value, filterValue) => value === filterValue,
      },
    },
    role: {
      label: lsi("admin", "field", "role"),
      output: (value) => <EnumText enumName={enumName} code={value} />,
      sort: (a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b),
      input: { Component: Uu5Forms.FormSelect, props: { required: true, itemList: roleItemList } },
      filterProps: {
        inputType: "select",
        inputProps: { itemList: roleItemList },
        filter: (value, filterValue) => value === filterValue,
      },
    },
    // Období, Od, Do. Při stejném období rozhodne funkce (předseda před členy) a jméno.
    ...periodFields({
      tieBreak: (a, b) =>
        roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role) || personText(a).localeCompare(personText(b), "cs"),
    }),
    ...(board
      ? {
          showContact: {
            ...boolField(lsi("admin", "membership", "showContact")),
            // `boolField` má sloupec na ✓ (72 px), hlavička „Kontakt na webu“ by se lámala po písmenech.
            columnProps: { maxWidth: 160, horizontalAlignment: "center" },
            filterProps: {
              inputType: "select",
              inputProps: { itemList: BOOL_ITEM_LIST },
              filter: (value, filterValue) => Boolean(value) === filterValue,
            },
          },
        }
      : null),
  };
}

// Modal: osoba a funkce vedle sebe, pod nimi od–do, kontakt na celý řádek (od `s`);
// na telefonu všechno pod sebou (`formGridLayout`).
const PAIR_LIST = [
  ["personId", "role"],
  ["dateFrom", "dateTo"],
];
const INITIAL_SORTER_LIST = [{ key: "period", ascending: true }];

function ManagementTable({ dataList, board }) {
  // Osoby do filtru z načtených záznamů záložky, každá jednou, podle abecedy.
  const personKey = (dataList.data ?? []).map((item) => item?.data?.personId).join(",");
  const personItemList = useMemo(() => {
    const byId = new Map();
    for (const item of dataList.data ?? []) {
      const data = item?.data;
      if (data?.personId && !byId.has(data.personId)) {
        byId.set(data.personId, data.person ? personLabel(data.person) : data.personId);
      }
    }
    return [...byId.entries()]
      .sort(([, a], [, b]) => a.localeCompare(b, "cs"))
      .map(([value, children]) => ({ value, children }));
  }, [personKey]);

  const { cfg, seriesList, columnList, sorterList, filterList } = useMemo(() => {
    const cfg = getConfig({ board, personItemList });
    return { cfg, ...UiElements.Crud.generate(cfg) };
  }, [board, personItemList]);

  return (
    <UiElements.Crud
      dataList={dataList}
      seriesList={seriesList}
      columnList={columnList}
      sorterDefinitionList={sorterList}
      initialSorterList={INITIAL_SORTER_LIST}
      filterDefinitionList={filterList}
      lsiError={ERROR_LSI}
    >
      {({ type }) => <CrudFormView cfg={cfg} operation={type} pairList={PAIR_LIST} />}
    </UiElements.Crud>
  );
}

/** Jedna záložka: záznamy týmu (`teamId`), nebo výboru (`board`). */
function ManagementTab({ tab }) {
  const board = tab === BOARD;
  const dtoIn = useMemo(() => (board ? { board: true } : { teamId: tab }), [tab]);
  // Nový záznam patří týmu záložky; výbor `teamId` nemá.
  const calls = useMemo(
    () => (board ? CALLS : { ...CALLS, createItem: (data) => CALLS.createItem({ ...data, teamId: tab }) }),
    [tab],
  );

  return (
    <ManagementProvider calls={calls} dtoIn={dtoIn}>
      {(dataList) => <ManagementTable dataList={dataList} board={board} />}
    </ManagementProvider>
  );
}

const EXTRA_TAB_LIST = [{ code: BOARD, label: <Lsi import={importLsi} path={["admin", "management", "board"]} /> }];

const AdminManagement = createVisualComponent({
  uu5Tag: Config.TAG + "AdminManagement",

  render() {
    const { activeTab, tabs } = useTeamTabs(EXTRA_TAB_LIST);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "coaches", "header")}>
        {tabs}
        {activeTab ? <ManagementTab key={activeTab} tab={activeTab} /> : null}
      </AdminScreen>
    );
  },
});

export default AdminManagement;
