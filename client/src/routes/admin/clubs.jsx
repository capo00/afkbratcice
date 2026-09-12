import { createVisualComponent, useMemo } from "uu5g05";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import TeamLogo from "../../components/team-logo.jsx";
import AdminScreen from "../../admin/screen.jsx";
import { nameField } from "../../admin/fields.jsx";
import { entityCalls } from "../../admin/crud-calls.js";
import { prepareImage } from "../../admin/image.js";
import { useApp } from "../../core/app-context.jsx";

// Klub nese erb a jméno reálného klubu -- víc věkových kategorií (Chotusice muži, dorost,
// žáci, ...) na něj odkazuje stejným `clubId` (`admin/teams.jsx`), takže se logo nahrává
// jednou, ne za každou kategorii zvlášť (design/data-model.md, 1.2).

const [ClubProvider] = UiElements.CrudContext.create("club");

const CONFIG = {
  logo: {
    label: lsi("admin", "field", "logo"),
    output: (value, item) => <TeamLogo uri={item.data.logoUri} size={28} alt="" />,
    columnProps: { maxWidth: 72, horizontalAlignment: "center" },
    input: { Component: UiElements.FormFile, props: { accept: "image/*" } },
  },
  name: nameField,
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminClubs = createVisualComponent({
  uu5Tag: Config.TAG + "AdminClubs",

  render() {
    const { reload } = useApp();

    // Zápis navíc obnoví app-context: změna erbu se přes `club/update` propíše na
    // `logoUri` VŠECH týmů klubu (server/club/crud.js), jenže mapu týmů drží app-context
    // načtený při startu SPA -- bez tohohle by veřejné dlaždice i seznam týmů ukazovaly
    // staré logo až do tvrdého reloadu.
    const calls = useMemo(() => {
      const base = entityCalls("club");
      const withReload = (fn) => async (dtoIn) => {
        const result = await fn(dtoIn);
        await reload();
        return result;
      };
      return {
        ...base,
        createItem: withReload(base.createItem),
        updateItem: withReload(base.updateItem),
        deleteItem: withReload(base.deleteItem),
      };
    }, [reload]);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "clubs", "header")}>
        <ClubProvider calls={calls}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              // Stejný důvod jako u týmů dřív: `onPreSubmit` je jediné místo, kudy projde
              // vytvoření i úprava, takže se zmenšení nedá obejít jedním z nich.
              onPreSubmit={async (e) => {
                if (e.data.value.logo) e.data.value.logo = await prepareImage(e.data.value.logo, "logo");
              }}
            >
              {() => UiElements.Crud.generateInputs(CONFIG)}
            </UiElements.Crud>
          )}
        </ClubProvider>
      </AdminScreen>
    );
  },
});

export default AdminClubs;
