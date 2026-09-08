import { createVisualComponent, Utils, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Uu5CodeKit from "uu5codekitg01-forms";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";

// Editor obsahu článku: pole sekcí, každá s `content` v `uu5String`.
//
// **Zatím se píše kód, ne WYSIWYG** (rozhodnuto 2026-09-06). Rich-text přijde s ECC a bude
// to výměna jednoho vstupu — proto je editor schovaný tady a ne rozsypaný po obrazovce.
//
// `Uu5CodeKit.Uu5String.Input` je Monaco se zvýrazněním uu5String; `displayGutter` vypnuté,
// protože čísla řádků u tříodstavcové novinky jen ubírají místo.

const LSI_PATH = ["admin", "sectionList"];

const SectionListInput = createVisualComponent({
  uu5Tag: Config.TAG + "SectionListInput",

  render({ value, onChange, ...props }) {
    const list = Array.isArray(value) ? value : [];

    function change(newList, e) {
      onChange?.(new Utils.Event({ value: newList }, e));
    }

    function move(index, delta, e) {
      const target = index + delta;
      if (target < 0 || target >= list.length) return;
      const newList = [...list];
      [newList[index], newList[target]] = [newList[target], newList[index]];
      change(newList, e);
    }

    return (
      <Uu5Elements.Grid rowGap={12} {...props}>
        {list.map((section, index) => (
          // Rám sekce je `Box` se `subdued` — linka bez výplně z GDS, ne vlastní border.
          <Uu5Elements.Box key={index} significance="subdued" borderRadius="moderate">
            <Uu5Elements.Grid rowGap={8} className={Config.Css.css({ padding: 8 })}>
              <div
                className={Config.Css.css({ display: "flex", justifyContent: "space-between", alignItems: "center" })}
              >
                <Uu5Elements.Text category="interface" segment="content" type="medium">
                  <Lsi import={importLsi} path={[...LSI_PATH, "section"]} params={{ index: index + 1 }} />
                </Uu5Elements.Text>
                <Uu5Elements.ActionGroup
                  itemList={[
                    { icon: "uugds-up", onClick: (e) => move(index, -1, e), disabled: index === 0 },
                    { icon: "uugds-down", onClick: (e) => move(index, 1, e), disabled: index === list.length - 1 },
                    {
                      icon: "uugds-delete",
                      colorScheme: "negative",
                      onClick: (e) => change(list.filter((_, i) => i !== index), e),
                    },
                  ]}
                />
              </div>

              <Uu5CodeKit.Uu5String.Input
                value={section.content ?? ""}
                displayGutter={false}
                minRows={4}
                maxRows={20}
                onChange={(e) =>
                  change(list.map((item, i) => (i === index ? { ...item, content: e.data.value } : item)), e)
                }
              />
            </Uu5Elements.Grid>
          </Uu5Elements.Box>
        ))}

        <div>
          <Uu5Elements.Button
            icon="uugds-plus"
            significance="distinct"
            colorScheme="primary"
            onClick={(e) => change([...list, { content: "<uu5string/>\n" }], e)}
          >
            <Lsi import={importLsi} path={[...LSI_PATH, "add"]} />
          </Uu5Elements.Button>
        </div>
      </Uu5Elements.Grid>
    );
  },
});

const FormSectionList = Uu5Forms.withFormItem(SectionListInput);

export { FormSectionList };
export default FormSectionList;
