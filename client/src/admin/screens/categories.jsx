import { createVisualComponent, useMemo, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../screen.jsx";
import { entityCalls } from "../crud-calls.js";
import { nameField, ageField } from "../fields.jsx";
import CrudFormView from "../crud-form-view.jsx";
import { useApp } from "../../core/app-context.jsx";

// Kategorie týmů (design/data-model.md, 2.3): A/B/C týmy mužů, rezervy mládeže, ženy, stará
// garda. Jen správce. Vizuál schválil Caio 2026-10-26 (canvas „AFK Bratčice – Kategorie“).
//
// Pořadí je automatické -- server řadí podle věkové skupiny a kódu. Kód se po založení nemění
// (odkazují na něj týmy), a kategorii, kterou tým používá, nejde smazat; obojí hlídá server
// a texty chyb jsou v lsi `errors`.

const [CategoryProvider] = UiElements.CrudContext.create("category");

const ERROR_LSI = lsi("errors");

const CONFIG = {
  code: {
    label: lsi("admin", "field", "code"),
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      // Při úpravě jen ke čtení: změnu by server stejně odmítl (`category/codeImmutable`).
      props: ({ operation }) =>
        operation === "update"
          ? { readOnly: true, message: <Lsi import={importLsi} path={["admin", "category", "codeLocked"]} /> }
          : {
              required: true,
              maxLength: 20,
              pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
              message: <Lsi import={importLsi} path={["admin", "category", "codeHint"]} />,
            },
    },
  },
  name: nameField,
  age: {
    ...ageField,
    input: {
      ...ageField.input,
      props: { ...ageField.input.props, message: <Lsi import={importLsi} path={["admin", "category", "ageHint"]} /> },
    },
  },
  teamCount: {
    label: lsi("admin", "field", "teamCount"),
    sort: true,
    columnProps: { maxWidth: 96, horizontalAlignment: "right" },
    input: false,
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminCategories = createVisualComponent({
  uu5Tag: Config.TAG + "AdminCategories",

  render() {
    const { reload } = useApp();

    // Zápis obnoví app-context: z kategorií se skládají popisky týmů v administraci i na webu.
    const calls = useMemo(() => {
      const base = entityCalls("category");
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
      <AdminScreen titleLsi={lsi("admin", "menu", "categories", "header")}>
        <CategoryProvider calls={calls}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              lsiError={ERROR_LSI}
            >
              {({ type }) => <CrudFormView cfg={CONFIG} operation={type} pairList={[["code", "name"]]} />}
            </UiElements.Crud>
          )}
        </CategoryProvider>
      </AdminScreen>
    );
  },
});

export default AdminCategories;
