import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";

const CustomerInput = createVisualComponent({
  uu5Tag: Config.TAG + "CustomerInput",

  render(props) {
    const dto = useDataObject({
      handlerMap: {
        load: () => OcElements.Call.cmdGet("caio-lenavisage/customer/list"),
      }
    });

    const data = dto.data?.itemList;
    const isPending = dto.state === "pendingNoData" || !data;
    const itemList = data?.map((customer) => ({ value: customer, children: customer.name })) ?? [];

    return (
      <Uu5Forms.FormTextSelect
        {...props}
        itemList={itemList}
        insertable
        pending={isPending}
      />
    );
  },
});

export default CustomerInput;
