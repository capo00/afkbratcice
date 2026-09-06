import { createVisualComponent, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { EnumText, enumItemList, dateField } from "../../admin/fields.jsx";
import PhotoUpload from "../../admin/photo-upload.jsx";

// Fotoalba. Nahrávání fotek je **vlastní akce řádku**, ne pole formuláře: album se zakládá
// jednou a fotky se do něj sypou opakovaně, často jindy a někým jiným.

const [GalleryProvider] = UiElements.CrudContext.create("gallery");

const CONFIG = {
  name: {
    label: lsi("admin", "field", "name"),
    sort: true,
    input: { Component: Uu5Forms.FormText, props: { required: true, maxLength: 120 } },
  },
  date: dateField(lsi("admin", "field", "date"), { required: true }),
  category: {
    label: lsi("admin", "field", "category"),
    sort: true,
    output: (value) => <EnumText enumName="galleryCategory" code={value} />,
    input: {
      Component: Uu5Forms.FormSelect,
      props: { itemList: enumItemList("galleryCategory", Config.GALLERY_CATEGORY_LIST) },
    },
    filterProps: {
      inputType: "select",
      inputProps: { itemList: enumItemList("galleryCategory", Config.GALLERY_CATEGORY_LIST) },
      filter: (value, filterValue) => value === filterValue,
    },
  },
  state: {
    label: lsi("admin", "field", "state"),
    sort: true,
    columnProps: { maxWidth: 130 },
    output: (value) => <EnumText enumName="galleryState" code={value} />,
    input: {
      Component: Uu5Forms.FormSelect,
      props: { itemList: enumItemList("galleryState", ["draft", "published"]) },
    },
  },
  author: {
    label: lsi("admin", "field", "author2"),
    columnProps: { maxWidth: 140 },
    input: { Component: Uu5Forms.FormText, props: { maxLength: 60 } },
  },
  // Denormalizovaný počet, který si album udržuje samo (`gallery/crud.js`) — proto jen
  // sloupec, ne vstup.
  photoCount: {
    label: lsi("admin", "field", "photoCount"),
    sort: true,
    columnProps: { maxWidth: 80, horizontalAlignment: "center" },
  },
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

const AdminGalleries = createVisualComponent({
  uu5Tag: Config.TAG + "AdminGalleries",

  render() {
    const [uploadTo, setUploadTo] = useState();

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "galleries", "header")}>
        <GalleryProvider>
          {(dataList) => (
            <>
              <UiElements.Crud
                dataList={dataList}
                seriesList={seriesList}
                columnList={columnList}
                sorterDefinitionList={sorterList}
                filterDefinitionList={filterList}
                initialSorterList={[{ key: "date", ascending: false }]}
                getItemActionList={({ data }) => [
                  {
                    icon: "uugds-image-multi",
                    children: <Lsi import={importLsi} path={["admin", "photoUpload", "action"]} />,
                    onClick: () => setUploadTo(data.data),
                  },
                ]}
              >
                {() => UiElements.Crud.generateInputs(CONFIG)}
              </UiElements.Crud>

              {uploadTo ? (
                <Uu5Elements.Modal
                  open
                  onClose={() => setUploadTo()}
                  header={<Lsi import={importLsi} path={["admin", "photoUpload", "header"]} params={{ name: uploadTo.name }} />}
                >
                  <PhotoUpload
                    galleryId={uploadTo.id}
                    onClose={() => setUploadTo()}
                    // Po nahrání se seznam načte znovu: `photoCount` a titulní náhled
                    // dopočítává server, takže lokální stav by je neměl odkud vzít.
                    onDone={() => dataList.handlerMap.load(dataList.dtoIn)}
                  />
                </Uu5Elements.Modal>
              ) : null}
            </>
          )}
        </GalleryProvider>
      </AdminScreen>
    );
  },
});

export default AdminGalleries;
