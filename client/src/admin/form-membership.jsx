import { createVisualComponent, useDataObject, useMemo, Utils, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { teamLabel } from "./fields.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

// Editor členství v čase: pole `{ id, role?, dateFrom, dateTo, showContact? }`.
//
// Hráč i vedení drží členství **v čase**, ne jako prosté „patří do týmu" — bez toho by
// soupiska loňské sezóny ukazovala dnešní stav a odchod hráče by přepsal historii.
// `dateTo: null` znamená aktivní.
//
// Tři podoby téhož editoru (propsy):
//   hráč             týmy                         (výchozí)
//   vedení v týmu    týmy + funkce                `roleItemList`
//   výbor AFK        funkce + kontakt na webu     `team={false}`, `roleItemList`, `showContact`
//
// Je to **jeden vstup nad celým polem**, ne `player/addTeam` + `endTeam`: `update` bere celý
// `teamList` a formulář ho stejně celý odesílá, takže dvě úzké operace navíc by znamenaly
// druhou cestu k témuž. (Server je má, `management` ale ne — jednotný vstup platí pro oba.)

const LSI_PATH = ["admin", "membership"];

const MembershipInput = createVisualComponent({
  uu5Tag: Config.TAG + "MembershipInput",

  render({ value, onChange, team = true, roleItemList, showContact = false, addLsiPath, label, required, ...props }) {
    const list = Array.isArray(value) ? value : [];
    const app = useApp();

    // Jen naše týmy: hráči i vedení jsou klubu, soupeř tu nemá co dělat.
    // Výbor tým nemá, seznam týmů pak netřeba.
    const { data } = useDataObject(
      {
        handlerMap: {
          load: () => (team ? UiElements.Call.cmdGet("/team/list", { own: true }) : Promise.resolve({ itemList: [] })),
        },
      },
      [team],
    );
    const teamItemList = useMemo(
      // Všechny se jmenují „AFK Bratčice“: v úzkém sloupci rozliší tým jen kategorie.
      () =>
        (data?.itemList ?? []).map((item) => ({
          value: item.id,
          children: app.getCategory(item.category)?.name ?? teamLabel(item, app),
        })),
      [data, app],
    );

    function change(newList, e) {
      onChange?.(new Utils.Event({ value: newList }, e));
    }

    function update(index, patch, e) {
      change(list.map((item, i) => (i === index ? { ...item, ...patch } : item)), e);
    }

    const templateColumns = [
      team && "minmax(160px, 2fr)",
      roleItemList && "minmax(140px, 1.5fr)",
      "minmax(120px, 1fr)",
      "minmax(120px, 1fr)",
      showContact && "auto",
      "auto",
    ]
      .filter(Boolean)
      .join(" ");

    function newItem() {
      // Nové členství začíná dnes a nemá konec — to je stav, kvůli kterému ho někdo
      // přidává; datum se dá přepsat, když se dopisuje historie.
      return {
        ...(team ? { id: teamItemList[0]?.value } : null),
        ...(roleItemList ? { role: roleItemList[0]?.value } : null),
        dateFrom: new Date().toISOString().slice(0, 10),
        dateTo: null,
        ...(showContact ? { showContact: false } : null),
      };
    }

    return (
      <Uu5Elements.Grid rowGap={8} {...props}>
        {/* `withFormItem` popisek nekreslí, to dělá až vstup -- tenhle je vlastní. */}
        {label ? <Uu5Forms.Label required={required}>{label}</Uu5Forms.Label> : null}
        {list.map((item, index) => (
          <Uu5Elements.Grid key={index} templateColumns={templateColumns} columnGap={8} alignItems="end">
            {team ? (
              <Uu5Forms.Select
                value={item.id}
                itemList={teamItemList}
                onChange={(e) => update(index, { id: e.data.value }, e)}
              />
            ) : null}
            {roleItemList ? (
              <Uu5Forms.Select
                value={item.role}
                itemList={roleItemList}
                onChange={(e) => update(index, { role: e.data.value }, e)}
              />
            ) : null}
            <Uu5Forms.Date
              value={item.dateFrom ?? undefined}
              onChange={(e) => update(index, { dateFrom: e.data.value ?? null }, e)}
            />
            <Uu5Forms.Date
              value={item.dateTo ?? undefined}
              onChange={(e) => update(index, { dateTo: e.data.value ?? null }, e)}
            />
            {showContact ? (
              <Uu5Forms.Checkbox
                label={<Lsi import={importLsi} path={[...LSI_PATH, "showContact"]} />}
                value={Boolean(item.showContact)}
                onChange={(e) => update(index, { showContact: e.data.value }, e)}
              />
            ) : null}
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
            onClick={(e) => change([...list, newItem()], e)}
          >
            <Lsi import={importLsi} path={addLsiPath ?? [...LSI_PATH, "add"]} />
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
