import { createVisualComponent, useEffect, useState, Utils } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { personLabel } from "./fields.jsx";

// Výběr osoby **s hledáním** (`person/list?query=`): osob jsou stovky a `EntitySelect`
// by je načítal všechny, i když se hledá jedna.
//
// Hodnota ve formuláři zůstává holé `personId` -- `TextSelectAsync` sám drží položku
// (`{ value, children }`), takže se jméno k id dohledá jednou (`idList`) a formulář
// odesílá totéž co dřív. Vzor je caio-ui `UiAuth.FormIdentitySelect`, jen nad osobami.

const toItem = (person) => ({ value: person.id, children: personLabel(person) });

const PersonSelectInput = createVisualComponent({
  uu5Tag: Config.TAG + "PersonSelectInput",

  render({ value, onChange, ...props }) {
    const [selected, setSelected] = useState();

    useEffect(() => {
      if (!value || selected?.value === value) return undefined;
      let alive = true;
      UiElements.Call.cmdGet("/person/list", { idList: [value] })
        .then(({ itemList }) => alive && itemList?.[0] && setSelected(toItem(itemList[0])))
        .catch(() => alive && setSelected({ value, children: value }));
      return () => {
        alive = false;
      };
    }, [value]);

    async function handleSearch(e) {
      const query = e.data.value?.trim();
      if (!query) return undefined;
      const { itemList } = await UiElements.Call.cmdGet("/person/list", { query, pageInfo: { pageSize: 20 } });
      return (itemList ?? []).map(toItem);
    }

    return (
      <Uu5Forms.TextSelectAsync
        {...props}
        value={value ? selected : undefined}
        onSearch={handleSearch}
        onChange={(e) => {
          const item = e.data.value;
          setSelected(item ?? undefined);
          onChange?.(new Utils.Event({ value: item?.value ?? null }, e));
        }}
      />
    );
  },
});

const FormPersonSelect = Uu5Forms.withFormItem(PersonSelectInput);

export { FormPersonSelect };
export default FormPersonSelect;
