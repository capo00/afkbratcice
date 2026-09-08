import { createVisualComponent, useDataObject, useMemo, Utils, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { teamLabel } from "./fields.jsx";

const { theme } = Config;

// Editor členství v týmech: pole `{ id, dateFrom, dateTo }`.
//
// Hráč i trenér drží členství **v čase**, ne jako prosté „patří do týmu" — bez toho by
// soupiska loňské sezóny ukazovala dnešní stav a odchod hráče by přepsal historii.
// `dateTo: null` znamená aktivní.
//
// Je to **jeden vstup nad celým polem**, ne `player/addTeam` + `endTeam`: `update` bere celý
// `teamList` a formulář ho stejně celý odesílá, takže dvě úzké operace navíc by znamenaly
// druhou cestu k témuž. (Server je má, `coach` ale ne — jednotný vstup platí pro oba.)

const LSI_PATH = ["admin", "membership"];

const MembershipInput = createVisualComponent({
  uu5Tag: Config.TAG + "MembershipInput",

  render({ value, onChange, ...props }) {
    const list = Array.isArray(value) ? value : [];

    const { data } = useDataObject({ handlerMap: { load: () => UiElements.Call.cmdGet("/team/list", {}) } }, []);
    const teamItemList = useMemo(
      () => (data?.itemList ?? []).map((team) => ({ value: team.id, children: teamLabel(team) })),
      [data],
    );

    function change(newList, e) {
      onChange?.(new Utils.Event({ value: newList }, e));
    }

    function update(index, patch, e) {
      change(list.map((item, i) => (i === index ? { ...item, ...patch } : item)), e);
    }

    return (
      <Uu5Elements.Grid rowGap={8} {...props}>
        {list.map((item, index) => (
          <Uu5Elements.Grid
            key={index}
            templateColumns="minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) auto"
            columnGap={8}
            alignItems="end"
          >
            <Uu5Forms.Select
              value={item.id}
              itemList={teamItemList}
              onChange={(e) => update(index, { id: e.data.value }, e)}
            />
            <Uu5Forms.Date
              value={item.dateFrom ?? undefined}
              onChange={(e) => update(index, { dateFrom: e.data.value ?? null }, e)}
            />
            <Uu5Forms.Date
              value={item.dateTo ?? undefined}
              onChange={(e) => update(index, { dateTo: e.data.value ?? null }, e)}
            />
            <Uu5Elements.Button
              icon="uugds-delete"
              colorScheme="negative"
              significance="subdued"
              onClick={(e) => change(list.filter((_, i) => i !== index), e)}
            />
          </Uu5Elements.Grid>
        ))}

        <div>
          <Uu5Elements.Button
            icon="uugds-plus"
            significance="distinct"
            colorScheme="primary"
            // Nové členství začíná dnes a nemá konec — to je stav, kvůli kterému ho někdo
            // přidává; datum se dá přepsat, když se dopisuje historie.
            onClick={(e) =>
              change([...list, { id: teamItemList[0]?.value, dateFrom: new Date().toISOString().slice(0, 10), dateTo: null }], e)
            }
          >
            <Lsi import={importLsi} path={[...LSI_PATH, "add"]} />
          </Uu5Elements.Button>
        </div>

        <Uu5Elements.Text
          category="interface"
          segment="content"
          type="medium"
          className={Config.Css.css({ color: theme.color.mutedFg })}
        >
          <Lsi import={importLsi} path={[...LSI_PATH, "hint"]} />
        </Uu5Elements.Text>
      </Uu5Elements.Grid>
    );
  },
});

const FormMembership = Uu5Forms.withFormItem(MembershipInput);

export { FormMembership };
export default FormMembership;
