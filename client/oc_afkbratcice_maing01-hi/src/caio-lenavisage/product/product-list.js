import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import OcElements from "../../libs/oc_cli-elements";
import OcAuth from "../../libs/oc_cli-auth";
import Config from "./config/config.js";
import { withRoute } from "../../libs/oc_cli-app";
import { ProductListProvider } from "./product-context.js";

const CATEGORY_MAP = {};
Config.CATEGORY_ITEM_LIST.forEach((item) => { CATEGORY_MAP[item.value] = item; });

const SUB_CATEGORY_MAP = {};
Config.SUB_CATEGORY_ITEM_LIST.forEach((item) => { SUB_CATEGORY_MAP[item.value] = item; });

const CRUD_CONFIG = {
  name: {
    label: { cs: "Název" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      props: { required: true },
    },
  },
  code: {
    label: { cs: "Kód" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      props: { required: true },
    },
  },
  category: {
    label: { cs: "Kategorie" },
    sort: true,
    filterProps: {
      filter: (value, itemList) => itemList?.find?.((v) => value === v),
      inputType: "text-select",
      inputProps: {
        multiple: true,
        itemList: Config.CATEGORY_ITEM_LIST,
      },
    },
    input: {
      Component: Uu5Forms.FormSelect,
      props: {
        required: true,
        itemList: Config.CATEGORY_ITEM_LIST,
      },
    },
    output: (value) => CATEGORY_MAP[value]?.children || value,
  },
  subCategory: {
    label: { cs: "Podkategorie" },
    sort: true,
    input: {
      Component: Uu5Forms.FormSelect,
      props: {
        itemList: Config.SUB_CATEGORY_ITEM_LIST,
      },
    },
    output: (value) => SUB_CATEGORY_MAP[value]?.children || value || "–",
  },
  price: {
    label: { cs: "Cena" },
    sort: true,
    input: {
      Component: Uu5Forms.FormNumber,
      props: { required: true, min: 0 },
    },
    output: (value) => value != null ? `${value} Kč` : "–",
  },
  active: {
    label: { cs: "Aktivní" },
    input: {
      Component: Uu5Forms.FormSwitchSelect,
      props: {
        itemList: [
          { value: true, children: "Ano" },
          { value: false, children: "Ne" },
        ],
      },
    },
    output: (value) => value === false ? "Ne" : "Ano",
    visible: false,
  },
};

const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CRUD_CONFIG);

const ProductList = createVisualComponent({
  uu5Tag: Config.TAG + "ProductList",

  render(props) {
    const session = OcAuth.useSession();
    const isAuth = session.identity?.profileList?.includes("authorities");

    return (
      <ProductListProvider>
        {(dataList) => (
          <OcElements.Crud
            header={<Lsi lsi={{ cs: "Produkty" }} />}
            {...props}
            dataList={dataList}
            seriesList={seriesList}
            columnList={columnList}
            filterDefinitionList={filterList}
            sorterDefinitionList={sorterList}
            initialSorterList={[{ key: "category", ascending: true }]}
            readOnly={!isAuth}
          >
            {() => (
              <Uu5Forms.Form.View gridLayout={{
                xs: "name, code, category, subCategory, price, active",
                s: "name code, category subCategory, price active",
              }}>
                {OcElements.Crud.generateInputs(CRUD_CONFIG)}
              </Uu5Forms.Form.View>
            )}
          </OcElements.Crud>
        )}
      </ProductListProvider>
    );
  },
});

export { ProductList };
export default withRoute(ProductList);
