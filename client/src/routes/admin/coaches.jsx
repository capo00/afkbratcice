import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { entityCalls } from "../../admin/crud-calls.js";
import { EntitySelect, EnumText, enumItemList, personLabel } from "../../admin/fields.jsx";
import FormMembership from "../../admin/form-membership.jsx";

// Trenéři a funkcionáři. Stejná stavba jako hráči — role osoby s členstvím v čase —,
// jen místo postu a čísla dresu je `role` z číselníku `COACH_ROLE`.
//
// **Výbor klubu je taky tady** (`role: "board"`): je to funkce v klubu, ne u mužstva, takže
// pro ni nemá smysl další entita. Stránka `/vybor` se z toho časem dá postavit dotazem
// `coach/list?role=board` místo ručně psaného seznamu.

const [CoachProvider] = UiElements.CrudContext.create("coach");
// Bez `createMany`/`deleteMany` -- `coach` je na serveru nemá (admin/crud-calls.js).
const CALLS = entityCalls("coach");

const CONFIG = {
  personId: {
    label: lsi("admin", "field", "person"),
    sort: true,
    output: (value, item) => (item.data.person ? personLabel(item.data.person) : value),
    input: {
      Component: EntitySelect,
      props: { required: true, useCase: "/person/list", getLabel: personLabel },
    },
  },
  role: {
    label: lsi("admin", "field", "role"),
    sort: true,
    output: (value) => <EnumText enumName="coachRole" code={value} />,
    input: {
      Component: Uu5Forms.FormSelect,
      props: { required: true, itemList: enumItemList("coachRole", Config.COACH_ROLE_LIST) },
    },
    filterProps: {
      inputType: "select",
      inputProps: { itemList: enumItemList("coachRole", Config.COACH_ROLE_LIST) },
      filter: (value, filterValue) => value === filterValue,
    },
  },
  teamList: {
    label: lsi("admin", "field", "teamList"),
    output: (value) => (value ?? []).filter((m) => !m.dateTo).length || "",
    columnProps: { maxWidth: 90, horizontalAlignment: "center" },
    input: { Component: FormMembership, props: {} },
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminCoaches = createVisualComponent({
  uu5Tag: Config.TAG + "AdminCoaches",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "coaches", "header")}>
        <CoachProvider calls={CALLS}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
            >
              {() => UiElements.Crud.generateInputs(CONFIG)}
            </UiElements.Crud>
          )}
        </CoachProvider>
      </AdminScreen>
    );
  },
});

export default AdminCoaches;
