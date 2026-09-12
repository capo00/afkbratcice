import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { entityCalls } from "../../admin/crud-calls.js";
import { EnumText, enumItemList, dateTimeField } from "../../admin/fields.jsx";
import FormSectionList from "../../admin/form-section-list.jsx";
import { prepareImage } from "../../admin/image.js";

// Novinky.
//
// Publikace stojí na dvou polích: `state` a `publishTime`. Veřejný výpis chce **oboje** —
// `published` a čas, který už nastal —, takže naplánovat článek dopředu znamená vyplnit
// budoucí `publishTime` a nechat stav na `published`; nic dalšího se nepřeklikává.
//
// Titulní foto se před uploadem zmenší na 1200 px a překlopí do WebP (frontend.md, 6.2).

const [ArticleProvider] = UiElements.CrudContext.create("article");
// Bez `createMany`/`deleteMany` -- `article` je na serveru nemá (admin/crud-calls.js).
const CALLS = entityCalls("article");

const STATE_LIST = ["draft", "published", "archived"];

const CONFIG = {
  name: {
    label: lsi("admin", "field", "title"),
    sort: true,
    input: { Component: Uu5Forms.FormText, props: { required: true, maxLength: 160 } },
  },
  state: {
    label: lsi("admin", "field", "state"),
    sort: true,
    columnProps: { maxWidth: 130 },
    output: (value) => <EnumText enumName="articleState" code={value} />,
    input: {
      Component: Uu5Forms.FormSelect,
      props: { required: true, itemList: enumItemList("articleState", STATE_LIST) },
    },
    filterProps: {
      inputType: "select",
      inputProps: { itemList: enumItemList("articleState", STATE_LIST) },
      filter: (value, filterValue) => value === filterValue,
    },
  },
  publishTime: dateTimeField(lsi("admin", "field", "publishTime"), { required: true }),
  desc: {
    label: lsi("admin", "field", "perex"),
    output: false,
    input: { Component: Uu5Forms.FormTextArea, props: { required: true, maxLength: 300, autoResize: true } },
  },
  sectionList: {
    label: lsi("admin", "field", "content"),
    output: (value) => (value ?? []).length || "",
    columnProps: { maxWidth: 80, horizontalAlignment: "center" },
    input: { Component: FormSectionList, props: {} },
  },
  photograph: {
    label: lsi("admin", "field", "photograph"),
    output: false,
    input: { Component: UiElements.FormFile, props: { accept: "image/*" } },
  },
  author: {
    label: lsi("admin", "field", "author"),
    sort: true,
    columnProps: { maxWidth: 140 },
    input: { Component: Uu5Forms.FormText, props: { maxLength: 60 } },
  },
  // `priority > 0` = připnuto nahoru ve výpisu (ne v RSS).
  priority: {
    label: lsi("admin", "field", "priority"),
    sort: true,
    columnProps: { maxWidth: 90, horizontalAlignment: "center" },
    output: (value) => (value > 0 ? "📌" : ""),
    input: { Component: Uu5Forms.FormNumber, props: { min: 0, max: 9, step: 1 } },
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

// `sectionList` a `photograph` do výpisu nepatří — obsah se needituje ve sloupci a fotku
// tabulka stejně neukáže. Ostatní pole ano.
const HIDE_COLUMNS = ["sectionList"];

const AdminArticles = createVisualComponent({
  uu5Tag: Config.TAG + "AdminArticles",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "articles", "header")}>
        <ArticleProvider calls={CALLS}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              hideColumns={HIDE_COLUMNS}
              onPreSubmit={async (e) => {
                if (e.data.value.photograph) {
                  e.data.value.photograph = await prepareImage(e.data.value.photograph, "article");
                }
              }}
            >
              {() => UiElements.Crud.generateInputs(CONFIG)}
            </UiElements.Crud>
          )}
        </ArticleProvider>
      </AdminScreen>
    );
  },
});

export default AdminArticles;
