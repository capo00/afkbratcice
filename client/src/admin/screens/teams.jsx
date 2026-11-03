import { createVisualComponent, useDataObject, useMemo, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import TeamLogo from "../../components/team-logo.jsx";
import AdminScreen from "../screen.jsx";
import { nameField, categoryField, boolField, EntitySelect, clubLabel } from "../fields.jsx";
import { useApp } from "../../core/app-context.jsx";
import CrudFormView from "../crud-form-view.jsx";

// Správa týmů — vlastních i soupeřů.
//
// `own` rozhoduje o tom, jestli tým patří klubu; podle něj se staví přehled mužstev
// a `team/list?own=true`. Není to příznak k odvození: soupeř se stejným názvem jako naše
// mužstvo je běžná věc a z dat by to nikdo nepoznal.
//
// Logo se tady nenahrává — patří klubu (`screens/clubs.jsx`), na který se tým odkazuje
// přes `clubId`. Víc věkových kategorií stejného klubu tak sdílí jedno logo, ne tři
// nahrané kopie (design/data-model.md, 1.2).

const [TeamProvider] = UiElements.CrudContext.create("team");
// Bez `createMany`/`deleteMany` -- `team` je na serveru nemá (caio-ui `CrudContext.entityCalls`).
const CALLS = UiElements.CrudContext.entityCalls("team");

const BOOL_ITEM_LIST = [true, false].map((value) => ({
  value,
  children: <Lsi import={importLsi} path={["admin", "bool", String(value)]} />,
}));

// Filtry jsou na klientu: týmů je pár set a načítají se všechny. Nabídky klubů a kategorií
// se znají až za běhu, proto se config skládá v komponentě.
const getConfig = ({ clubItemList, categoryItemList }) => ({
  logo: {
    label: lsi("admin", "field", "logo"),
    output: (value, item) => <TeamLogo uri={item.data.logoUri} size={28} alt="" />,
    columnProps: { maxWidth: 72, horizontalAlignment: "center" },
    input: false,
  },
  name: nameField,
  shortName: {
    label: lsi("admin", "field", "shortName"),
    input: { Component: Uu5Forms.FormText, props: { maxLength: 30 } },
  },
  category: {
    ...categoryField,
    filterProps: {
      inputType: "select",
      inputProps: { itemList: categoryItemList },
      filter: (value, filterValue) => value === filterValue,
    },
  },
  own: {
    ...boolField(lsi("admin", "field", "own")),
    filterProps: {
      inputType: "select",
      inputProps: { itemList: BOOL_ITEM_LIST },
      filter: (value, filterValue) => Boolean(value) === filterValue,
    },
  },
  clubId: {
    label: lsi("admin", "field", "clubId"),
    output: false,
    input: {
      Component: EntitySelect,
      props: { required: true, useCase: "/club/list", getLabel: clubLabel },
    },
    filterProps: {
      inputType: "text-select",
      inputProps: { itemList: clubItemList },
      filter: (value, filterValue) => value === filterValue,
    },
  },
});

const AdminTeams = createVisualComponent({
  uu5Tag: Config.TAG + "AdminTeams",

  render() {
    const { teamCategoryList } = useApp();
    const { data: clubData } = useDataObject({ handlerMap: { load: () => UiElements.Call.cmdGet("/club/list", {}) } }, []);

    const CONFIG = useMemo(
      () =>
        getConfig({
          clubItemList: (clubData?.itemList ?? [])
            .map((club) => ({ value: club.id, children: clubLabel(club) }))
            .sort((a, b) => a.children.localeCompare(b.children, "cs")),
          categoryItemList: teamCategoryList.map((category) => ({ value: category.code, children: category.name })),
        }),
      [clubData, teamCategoryList],
    );
    const { seriesList, columnList, sorterList, filterList } = useMemo(() => UiElements.Crud.generate(CONFIG), [CONFIG]);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "teams", "header")}>
        <TeamProvider calls={CALLS}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
            >
              {({ type }) => <CrudFormView cfg={CONFIG} operation={type} pairList={[["name", "shortName"], ["category", "own"]]} />}
            </UiElements.Crud>
          )}
        </TeamProvider>
      </AdminScreen>
    );
  },
});

export default AdminTeams;
