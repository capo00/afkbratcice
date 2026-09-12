import { createVisualComponent, useState, useDataList, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { entityCalls } from "../../admin/crud-calls.js";
import { EnumText, enumItemList, dateField } from "../../admin/fields.jsx";
import PhotoUpload from "../../admin/photo-upload.jsx";

// Fotoalba. Nahrávání fotek je **vlastní akce řádku**, ne pole formuláře: album se zakládá
// jednou a fotky se do něj sypou opakovaně, často jindy a někým jiným.

// `useDataList` napřímo, ne `CrudContext`: ten umí položkové handlery jen pro `update`
// a `delete`, takže nahrání fotky by se muselo dohánět přenačtením celého seznamu alb.
// `gallery/addPhoto` vrací album s přepočítaným `photoCount` i titulním náhledem, takže
// si řádek vystačí sám -- stejně jako `admin/matches.jsx`.
//
// `createMany`/`deleteMany` se nepřidávají: `gallery` je na serveru nemá.
const GALLERY_CALLS = entityCalls("gallery");
const GALLERY_HANDLERS = {
  handlerMap: {
    load: GALLERY_CALLS.list,
    create: GALLERY_CALLS.createItem,
  },
  itemHandlerMap: {
    update: GALLERY_CALLS.updateItem,
    delete: GALLERY_CALLS.deleteItem,
    addPhoto: (dtoIn) => UiElements.Call.cmdPost("gallery/addPhoto", dtoIn),
  },
};

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
    const dataList = useDataList(GALLERY_HANDLERS);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "galleries", "header")}>
        <>
              <UiElements.Crud
                dataList={dataList}
                seriesList={seriesList}
                columnList={columnList}
                sorterDefinitionList={sorterList}
                filterDefinitionList={filterList}
                initialSorterList={[{ key: "date", ascending: false }]}
                // `data` je položka seznamu (`{ data, handlerMap }`), ne samotné album --
                // do stavu jde celá, aby upload mohl uložit jejím handlerem.
                getItemActionList={({ data: item }) => [
                  {
                    icon: "uugds-image-multi",
                    children: <Lsi import={importLsi} path={["admin", "photoUpload", "action"]} />,
                    onClick: () => setUploadTo(item),
                  },
                ]}
              >
                {() => UiElements.Crud.generateInputs(CONFIG)}
              </UiElements.Crud>

              {uploadTo ? (
                <Uu5Elements.Modal
                  open
                  onClose={() => setUploadTo()}
                  header={<Lsi import={importLsi} path={["admin", "photoUpload", "header"]} params={{ name: uploadTo.data.name }} />}
                >
                  <PhotoUpload
                    galleryId={uploadTo.data.id}
                    onClose={() => setUploadTo()}
                    onUpload={uploadTo.handlerMap.addPhoto}
                  />
                </Uu5Elements.Modal>
              ) : null}
        </>
      </AdminScreen>
    );
  },
});

export default AdminGalleries;
