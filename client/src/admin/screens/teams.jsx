import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import TeamLogo from "../../components/team-logo.jsx";
import AdminScreen from "../../admin/screen.jsx";
import { entityCalls } from "../../admin/crud-calls.js";
import { nameField, ageField, boolField, EntitySelect, clubLabel } from "../../admin/fields.jsx";

// Správa týmů — vlastních i soupeřů.
//
// `own` rozhoduje o tom, jestli tým patří klubu; podle něj se staví přehled mužstev
// a `team/list?own=true`. Není to příznak k odvození: soupeř se stejným názvem jako naše
// mužstvo je běžná věc a z dat by to nikdo nepoznal.
//
// Logo se tady nenahrává — patří klubu (`admin/clubs.jsx`), na který se tým odkazuje
// přes `clubId`. Víc věkových kategorií stejného klubu tak sdílí jedno logo, ne tři
// nahrané kopie (design/data-model.md, 1.2).

const [TeamProvider] = UiElements.CrudContext.create("team");
// Bez `createMany`/`deleteMany` -- `team` je na serveru nemá (admin/crud-calls.js).
const CALLS = entityCalls("team");

const CONFIG = {
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
  age: ageField,
  own: boolField(lsi("admin", "field", "own")),
  clubId: {
    label: lsi("admin", "field", "clubId"),
    output: false,
    input: {
      Component: EntitySelect,
      props: { required: true, useCase: "/club/list", getLabel: clubLabel },
    },
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminTeams = createVisualComponent({
  uu5Tag: Config.TAG + "AdminTeams",

  render() {
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
              {() => UiElements.Crud.generateInputs(CONFIG)}
            </UiElements.Crud>
          )}
        </TeamProvider>
      </AdminScreen>
    );
  },
});

export default AdminTeams;
