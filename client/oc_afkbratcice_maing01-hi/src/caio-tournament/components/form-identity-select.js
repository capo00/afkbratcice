import { createVisualComponent, useState, useCallback, useRef } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "./config/config.js";
import { Call } from "../../libs/oc_cli-elements/call.js";

const FormIdentitySelect = createVisualComponent({
  uu5Tag: Config.TAG + "FormIdentitySelect",

  render(props) {
    const { ...restProps } = props;
    const [itemList, setItemList] = useState();
    const debounceRef = useRef();

    const onSearch = useCallback(({ value }) => {
      clearTimeout(debounceRef.current);
      if (!value || value.length < 1) {
        setItemList(undefined);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        try {
          const result = await Call.cmdGet("identity/search", { query: value });
          const list = (result.itemList || []).map((item) => ({
            value: item.identity,
            children: `${item.name} (${item.identity})`,
          }));
          setItemList(list);
        } catch (e) {
          console.error("Identity search failed", e);
          setItemList([]);
        }
      }, 300);
    }, []);

    return (
      <Uu5Forms.FormTextSelect
        {...restProps}
        multiple
        itemList={itemList || []}
        onSearch={onSearch}
        pending={itemList === undefined && false}
      />
    );
  },
});

export { FormIdentitySelect };
export default FormIdentitySelect;
