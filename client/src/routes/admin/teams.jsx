import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import TeamLogo from "../../components/team-logo.jsx";
import AdminScreen from "../../admin/screen.jsx";
import { nameField, ageField, boolField } from "../../admin/fields.jsx";
import { prepareImage } from "../../admin/image.js";

// Správa týmů — vlastních i soupeřů.
//
// `own` rozhoduje o tom, jestli tým patří klubu; podle něj se staví přehled mužstev
// a `team/list?own=true`. Není to příznak k odvození: soupeř se stejným názvem jako naše
// mužstvo je běžná věc a z dat by to nikdo nepoznal.

const [TeamProvider] = UiElements.CrudContext.create("team");

const CONFIG = {
  logo: {
    label: lsi("admin", "field", "logo"),
    output: (value, item) => <TeamLogo uri={item.data.logoUri} size={28} alt="" />,
    columnProps: { maxWidth: 72, horizontalAlignment: "center" },
    input: { Component: UiElements.FormFile, props: { accept: "image/*" } },
  },
  name: nameField,
  shortName: {
    label: lsi("admin", "field", "shortName"),
    input: { Component: Uu5Forms.FormText, props: { maxLength: 30 } },
  },
  age: ageField,
  own: boolField(lsi("admin", "field", "own")),
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminTeams = createVisualComponent({
  uu5Tag: Config.TAG + "AdminTeams",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "teams", "header")}>
        <TeamProvider>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              // Logo se zmenší až tady, ne ve vstupu: `onPreSubmit` je jediné místo, kudy
              // projde vytvoření i úprava, takže se to nedá obejít jedním z nich.
              onPreSubmit={async (e) => {
                if (e.data.value.logo) e.data.value.logo = await prepareImage(e.data.value.logo, "logo");
              }}
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
