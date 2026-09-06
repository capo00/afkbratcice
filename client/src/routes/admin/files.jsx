import { createVisualComponent, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../../admin/screen.jsx";
import { dateField } from "../../admin/fields.jsx";
import { useApp } from "../../core/app-context.jsx";

// Soubory ke stažení.
//
// **Není to `UiElements.BinaryCrud`.** Ta kolekci umí, ale je záměrně nerozšiřitelná přes
// props — a veřejná stránka „Ke stažení" seskupuje podle `category` a řadí podle `date`,
// což jsou pole, která by tak nikdo nezapsal (design/frontend.md, 6.1). Skládá se proto
// vlastní `Crud` nad `BinaryProvider` s kolekcí `download`.
//
// Kategorie jsou z konfigurace (`appConfig.fileCategoryList`), ne z číselníku v kódu:
// „Rozpisy 2026/27" vzniká každý rok a nasazení kvůli tomu nikdo dělat nebude.

const COLLECTION = Config.BINARY_COLLECTION_DOWNLOAD;

function formatSize(size) {
  if (!Number.isFinite(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} kB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const AdminFiles = createVisualComponent({
  uu5Tag: Config.TAG + "AdminFiles",

  render() {
    const { appConfig } = useApp();

    const config = useMemo(() => {
      const categoryItemList = (appConfig?.fileCategoryList ?? []).map((item) => ({
        value: item.code,
        children: item.name,
      }));

      return {
        name: {
          label: lsi("admin", "field", "name"),
          sort: true,
          output: (value, item) =>
            item.data.uri ? (
              <Uu5Elements.Link href={item.data.uri} target="_blank" colorScheme="primary">
                {value}
              </Uu5Elements.Link>
            ) : (
              value
            ),
          input: { Component: Uu5Forms.FormText, props: { maxLength: 160 } },
        },
        // Soubor jde nahrát jen při zakládání: binárka je v GCS neměnná, výměna obsahu
        // znamená nové `uri` — takže se nahrává nový záznam a starý se maže.
        file: {
          label: lsi("admin", "field", "file"),
          output: false,
          input: {
            Component: UiElements.FormFile,
            props: ({ operation }) => ({ required: operation === "create", disabled: operation === "update" }),
          },
        },
        category: {
          label: lsi("admin", "field", "category"),
          sort: true,
          output: (value) => (appConfig?.fileCategoryList ?? []).find((c) => c.code === value)?.name ?? value,
          input: { Component: Uu5Forms.FormSelect, props: { itemList: categoryItemList } },
          filterProps: {
            inputType: "select",
            inputProps: { itemList: categoryItemList },
            filter: (value, filterValue) => value === filterValue,
          },
        },
        date: dateField(lsi("admin", "field", "date")),
        size: {
          label: lsi("admin", "field", "size"),
          sort: true,
          columnProps: { maxWidth: 100, horizontalAlignment: "end" },
          output: (value) => formatSize(value),
        },
      };
    }, [appConfig]);

    const { seriesList, columnList, sorterList, filterList } = useMemo(
      () => UiElements.Crud.generate(config),
      [config],
    );

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "files", "header")}>
        <UiElements.BinaryProvider dtoIn={{ collection: COLLECTION }}>
          {(dataList) => (
            <UiElements.Crud
              dataList={dataList}
              seriesList={seriesList}
              columnList={columnList}
              sorterDefinitionList={sorterList}
              filterDefinitionList={filterList}
              initialSorterList={[{ key: "date", ascending: false }]}
              // Kolekce musí jít s každým zápisem — `binary/*` podle ní autorizuje.
              onPreSubmit={(e) => {
                e.data.value.collection = COLLECTION;
              }}
            >
              {/* `operation` musí dolů: soubor je povinný při zakládání a needitovatelný
                  při úpravě, a to se bez něj rozlišit nedá. */}
              {({ type }) => UiElements.Crud.generateInputs(config, { operation: type })}
            </UiElements.Crud>
          )}
        </UiElements.BinaryProvider>
      </AdminScreen>
    );
  },
});

export default AdminFiles;
