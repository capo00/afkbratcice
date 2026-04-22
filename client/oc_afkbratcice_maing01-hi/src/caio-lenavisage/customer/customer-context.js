import OcElements from "../../libs/oc_cli-elements";

const [CustomerListProvider, useCustomerList] = OcElements.CrudContext.create("caio-lenavisage/customer");

export { CustomerListProvider, useCustomerList };
