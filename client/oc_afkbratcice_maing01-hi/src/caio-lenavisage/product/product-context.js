import OcElements from "../../libs/oc_cli-elements";

const [ProductListProvider, useProductList] = OcElements.CrudContext.create("caio-lenavisage/product");

export { ProductListProvider, useProductList };
