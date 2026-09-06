import { createVisualComponent } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { noteField, dateField } from "../../admin/fields.jsx";
import { prepareImage } from "../../admin/image.js";

// Osoby. Jedna osoba = jeden člověk; hráčství i trenérství jsou samostatné role nad ní
// (`player`, `coach`), takže trenér, který si občas zahraje, není v databázi dvakrát.
//
// **Kontakty jsou neveřejné** — server je vrací jen roli `CONTENT` a výš (a osobě samotné).
// V tabulce tu tedy jsou, ve veřejné soupisce ne.

const [PersonProvider] = UiElements.CrudContext.create("person");

const CONFIG = {
  surname: {
    label: lsi("admin", "field", "surname"),
    sort: true,
    input: { Component: Uu5Forms.FormText, props: { required: true, maxLength: 60 } },
  },
  name: {
    label: lsi("admin", "field", "firstName"),
    sort: true,
    input: { Component: Uu5Forms.FormText, props: { required: true, maxLength: 60 } },
  },
  birthdate: dateField(lsi("admin", "field", "birthdate")),
  email: {
    label: lsi("admin", "field", "email"),
    input: { Component: Uu5Forms.FormEmail, props: {} },
  },
  phone: {
    label: lsi("admin", "field", "phone"),
    input: { Component: Uu5Forms.FormText, props: { maxLength: 30 } },
  },
  photo: {
    label: lsi("admin", "field", "photo"),
    output: false,
    input: { Component: UiElements.FormFile, props: { accept: "image/*" } },
  },
  note: noteField,
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminPersons = createVisualComponent({
  uu5Tag: Config.TAG + "AdminPersons",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "persons", "header")}>
        <PersonProvider>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              initialSorterList={[{ key: "surname", ascending: true }]}
              onPreSubmit={async (e) => {
                if (e.data.value.photo) e.data.value.photo = await prepareImage(e.data.value.photo, "portrait");
              }}
            >
              {() => UiElements.Crud.generateInputs(CONFIG)}
            </UiElements.Crud>
          )}
        </PersonProvider>
      </AdminScreen>
    );
  },
});

export default AdminPersons;
