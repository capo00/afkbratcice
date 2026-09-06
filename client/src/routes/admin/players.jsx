import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { EntitySelect, EnumText, enumItemList, noteField, personLabel } from "../../admin/fields.jsx";
import FormMembership from "../../admin/form-membership.jsx";

// Hráči. Hráč není osoba — je to **role osoby**: číslo dresu, post a členství v týmech
// v čase. Osoba musí existovat dřív (`admin/persons`), proto je tu jen výběr, ne zakládání.

const [PlayerProvider] = UiElements.CrudContext.create("player");

const CONFIG = {
  personId: {
    label: lsi("admin", "field", "person"),
    sort: true,
    // Server vrací u hráče vloženou `person`, takže se ve sloupci nemusí dohledávat.
    output: (value, item) => (item.data.person ? personLabel(item.data.person) : value),
    input: {
      Component: EntitySelect,
      props: { required: true, useCase: "/person/list", getLabel: personLabel },
    },
  },
  number: {
    label: lsi("admin", "field", "number"),
    sort: true,
    columnProps: { maxWidth: 80, horizontalAlignment: "center" },
    input: { Component: Uu5Forms.FormNumber, props: { min: 1, max: 99, step: 1 } },
  },
  position: {
    label: lsi("admin", "field", "position"),
    sort: true,
    output: (value) => <EnumText enumName="position" code={value} />,
    input: { Component: Uu5Forms.FormSelect, props: { itemList: enumItemList("position", Config.POSITION_LIST) } },
  },
  teamList: {
    label: lsi("admin", "field", "teamList"),
    output: (value) => (value ?? []).filter((m) => !m.dateTo).length || "",
    columnProps: { maxWidth: 90, horizontalAlignment: "center" },
    input: { Component: FormMembership, props: {} },
  },
  note: noteField,
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminPlayers = createVisualComponent({
  uu5Tag: Config.TAG + "AdminPlayers",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "players", "header")}>
        <PlayerProvider>
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
        </PlayerProvider>
      </AdminScreen>
    );
  },
});

export default AdminPlayers;
