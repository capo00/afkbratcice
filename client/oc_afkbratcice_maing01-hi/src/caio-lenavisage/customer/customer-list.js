import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import OcElements from "../../libs/oc_cli-elements";
import OcAuth from "../../libs/oc_cli-auth";
import Config from "../config/config.js";
import { withRoute } from "../../libs/oc_cli-app";
import { CustomerListProvider } from "./customer-context.js";

const CRUD_CONFIG = {
  name: {
    label: { cs: "Jméno" },
    sort: true,
    input: {
      Component: Uu5Forms.FormText,
      props: { required: true },
    },
  },
};

const { seriesList, columnList, sorterList, filterList } = OcElements.Crud.generate(CRUD_CONFIG);

const CustomerList = createVisualComponent({
  uu5Tag: Config.TAG + "CustomerList",

  render(props) {
    const session = OcAuth.useSession();
    const isAuth = session.identity?.profileList?.includes("authorities");

    return (
      <CustomerListProvider>
        {(dataList) => (
          <OcElements.Crud
            header={<Lsi lsi={{ cs: "Zákazníci" }} />}
            {...props}
            dataList={dataList}
            seriesList={seriesList}
            columnList={columnList}
            filterDefinitionList={filterList}
            sorterDefinitionList={sorterList}
            initialSorterList={[{ key: "name", ascending: true }]}
            readOnly={!isAuth}
          >
            {() => (
              <Uu5Forms.Form.View gridLayout={{ xs: "name" }}>
                {OcElements.Crud.generateInputs(CRUD_CONFIG)}
              </Uu5Forms.Form.View>
            )}
          </OcElements.Crud>
        )}
      </CustomerListProvider>
    );
  },
});

export { CustomerList };
export default withRoute(CustomerList);
