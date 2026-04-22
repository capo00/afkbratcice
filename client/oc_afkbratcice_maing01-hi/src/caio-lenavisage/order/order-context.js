import OcElements from "../../libs/oc_cli-elements";

const [OrderListProvider, useOrderList] = OcElements.CrudContext.create("caio-lenavisage/order");

export { OrderListProvider, useOrderList };
