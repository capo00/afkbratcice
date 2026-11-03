import { createVisualComponent, Lsi } from "uu5g05";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../screen.jsx";
import { enumItemList, personLabel, teamLabel } from "../fields.jsx";
import { useApp } from "../../core/app-context.jsx";
import CrudFormView from "../crud-form-view.jsx";
import FormMembership from "../form-membership.jsx";
import FormPersonSelect from "../form-person-select.jsx";

// Vedení klubu: trenéři, asistenti a vedoucí týmů a výbor AFK (entita `management`).
//
// **Jeden záznam na osobu**: kdo trénuje dva týmy a sedí ve výboru, má jeden řádek. Působení
// v týmu je členství v čase s funkcí (jako u hráče, jen místo postu `role`), výbor je klubový,
// takže bez týmu -- jen funkce, období a jestli se má kontakt ukázat na stránce `/vybor`.

const [ManagementProvider] = UiElements.CrudContext.create("management");
// Bez `createMany`/`deleteMany` -- `management` je na serveru nemá (caio-ui `CrudContext.entityCalls`).
const CALLS = UiElements.CrudContext.entityCalls("management");

const TEAM_ROLE_ITEM_LIST = enumItemList("teamRole", Config.TEAM_ROLE_LIST);
const BOARD_ROLE_ITEM_LIST = enumItemList("boardRole", Config.BOARD_ROLE_LIST);

const today = () => new Date().toISOString().slice(0, 10);
const isActive = (m) => (!m.dateFrom || m.dateFrom <= today()) && (!m.dateTo || m.dateTo >= today());

/** Trvající působení v týmech: „Muži A (Trenér), Žáci (Asistent)“. */
function TeamRoles({ teamList }) {
  const app = useApp();
  return (teamList ?? []).filter(isActive).map((m, i) => (
    <span key={i}>
      {i ? ", " : ""}
      {app.getTeam(m.id) ? teamLabel(app.getTeam(m.id), app) : m.id} (
      <Lsi import={importLsi} path={["enum", "teamRole", m.role]} />)
    </span>
  ));
}

function BoardRoles({ boardList }) {
  return (boardList ?? []).filter(isActive).map((m, i) => (
    <span key={i}>
      {i ? ", " : ""}
      <Lsi import={importLsi} path={["enum", "boardRole", m.role]} />
    </span>
  ));
}

const CONFIG = {
  personId: {
    label: lsi("admin", "field", "person"),
    sort: true,
    output: (value, item) => (item.data.person ? personLabel(item.data.person) : value),
    input: { Component: FormPersonSelect, props: { required: true } },
  },
  teamList: {
    label: lsi("admin", "field", "teamRoleList"),
    output: (value) => <TeamRoles teamList={value} />,
    input: { Component: FormMembership, props: { roleItemList: TEAM_ROLE_ITEM_LIST } },
    filterProps: {
      inputType: "select",
      inputProps: { itemList: TEAM_ROLE_ITEM_LIST },
      filter: (value, filterValue) => (value ?? []).some((m) => m.role === filterValue && isActive(m)),
    },
  },
  boardList: {
    label: lsi("admin", "field", "boardList"),
    output: (value) => <BoardRoles boardList={value} />,
    input: {
      Component: FormMembership,
      props: {
        team: false,
        roleItemList: BOARD_ROLE_ITEM_LIST,
        showContact: true,
        addLsiPath: ["admin", "membership", "addBoard"],
      },
    },
    filterProps: {
      inputType: "select",
      inputProps: { itemList: BOARD_ROLE_ITEM_LIST },
      filter: (value, filterValue) => (value ?? []).some((m) => m.role === filterValue && isActive(m)),
    },
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminManagement = createVisualComponent({
  uu5Tag: Config.TAG + "AdminManagement",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "coaches", "header")}>
        <ManagementProvider calls={CALLS}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
            >
              {({ type }) => <CrudFormView cfg={CONFIG} operation={type} />}
            </UiElements.Crud>
          )}
        </ManagementProvider>
      </AdminScreen>
    );
  },
});

export default AdminManagement;
