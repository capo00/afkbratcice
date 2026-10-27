import { createVisualComponent, useDataObject, useMemo, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "../tools/caio-ui.js";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import DateText from "../components/date-text.jsx";
import { useApp } from "../core/app-context.jsx";

// Stavební kameny konfigurací pro `UiElements.Crud`.
//
// Každá obrazovka administrace je podle návrhu **konfigurační objekt**, ne vlastní tabulka
// (design/frontend.md, 6.1): klíč = pole entity, hodnota = jak se vykreslí ve sloupci
// (`output`), jak se edituje (`input`) a jestli se podle něj řadí a filtruje. Sdílené kusy
// jsou tady, aby se číselník nebo výběr týmu nepsal na pěti obrazovkách pětkrát.

/** Popisky číselníků jsou v LSI, ne v configu — číselník drží jen kódy a pořadí. */
function enumItemList(enumName, codeList) {
  return codeList.map((code) => ({
    value: code,
    children: <Lsi import={importLsi} path={["enum", enumName, code]} />,
  }));
}

function EnumText({ enumName, code }) {
  if (!code) return null;
  return <Lsi import={importLsi} path={["enum", enumName, code]} />;
}

/**
 * Výběr ze seznamu entit (tým, sezóna, osoba).
 *
 * Vlastní komponenta, ne `FormSelect` s natvrdo daným `itemList`: seznam se musí načíst
 * ze serveru a formulář se otevírá v modalu, takže dotaz patří dovnitř vstupu — jinak by
 * ho musela udělat každá obrazovka a předat dolů propem.
 */
const EntitySelect = createVisualComponent({
  uu5Tag: Config.TAG + "EntitySelect",

  // `valueKey`: co se ukládá -- `id` (výchozí), nebo jiný klíč entity (kategorie se
  // odkazují kódem, `afk_category.code`).
  render({ useCase, dtoIn, getLabel, valueKey = "id", ...props }) {
    // `getLabel(item, app)`: popisek může sáhnout do app-contextu (kategorie týmu).
    const app = useApp();
    const { state, data } = useDataObject(
      { handlerMap: { load: () => UiElements.Call.cmdGet(useCase, dtoIn ?? {}) } },
      [useCase, JSON.stringify(dtoIn ?? {})],
    );

    const itemList = useMemo(
      () => (data?.itemList ?? []).map((item) => ({ value: item[valueKey], children: getLabel(item, app) })),
      [data, getLabel, valueKey, app],
    );

    // `pending` místo prázdného seznamu: prázdný select vypadá jako „není z čeho vybrat",
    // což je jiná informace než „ještě se to načítá".
    return <Uu5Forms.FormSelect {...props} itemList={itemList} pending={state === "pendingNoData"} />;
  },
});

// Jméno + kategorie: „AFK Bratčice“ je v men-a, u19 i u15 a ve výběru týmu zápasu by se
// jinak nedaly rozlišit. Kategorie z app-contextu (bez něj jen jméno).
const teamLabel = (team, app) => {
  const category = app?.getCategory?.(team.category)?.name;
  return category ? `${team.name} (${category})` : team.name;
};
const clubLabel = (club) => club.name;
const personLabel = (person) => [person.surname, person.name].filter(Boolean).join(" ") || person.id;
const seasonLabel = (season) => `${season.competition} ${season.yearFrom}/${String(Number(season.yearFrom) + 1).slice(-2)}`;

//@@viewOn:sdílená pole
const nameField = {
  label: lsi("admin", "field", "name"),
  sort: true,
  input: { Component: Uu5Forms.FormText, props: { required: true, maxLength: 120 } },
};

const noteField = {
  label: lsi("admin", "field", "note"),
  output: false,
  input: { Component: Uu5Forms.FormTextArea, props: { maxLength: 500, autoResize: true } },
};

/** Název kategorie podle kódu; kategorie načítá app-context. */
function CategoryText({ code }) {
  const { getCategory } = useApp();
  return getCategory(code)?.name ?? code ?? "";
}

const categoryLabel = (category) => category.name;

// Kategorie týmu (`team.category` = `afk_category.code`). Seznam kategorií se spravuje na
// obrazovce Kategorie, proto výběr ze serveru, ne pevný číselník.
const categoryField = {
  label: lsi("admin", "field", "category"),
  sort: true,
  output: (value) => <CategoryText code={value} />,
  input: {
    Component: EntitySelect,
    props: { required: true, useCase: "/category/list", valueKey: "code", getLabel: categoryLabel },
  },
};

const ageField = {
  label: lsi("admin", "field", "age"),
  sort: true,
  output: (value) => <EnumText enumName="age" code={value} />,
  input: {
    Component: Uu5Forms.FormSelect,
    props: { required: true, itemList: enumItemList("age", Config.AGE_LIST) },
  },
  filterProps: {
    inputProps: { itemList: enumItemList("age", Config.AGE_LIST) },
    inputType: "select",
    filter: (value, filterValue) => value === filterValue,
  },
};

// Datum se vypisuje česky, ukládá se ISO — proto `output`, ne holá hodnota. Vrací se
// `DateText`, tedy komponenta, ne řetězec: sazbu data řeší `Uu5Elements.DateTime` uvnitř
// a administrace tak píše datum stejně jako web. `output` node umí — `caio-ui` sám vrací
// `<Uu5Elements.DateTime>` ve svém `binary-crud`.
const dateField = (labelPath, { required = false } = {}) => ({
  label: labelPath,
  sort: true,
  output: (value) => <DateText value={value} />,
  input: { Component: Uu5Forms.FormDate, props: { required } },
});

const dateTimeField = (labelPath, { required = false } = {}) => ({
  label: labelPath,
  sort: true,
  output: (value) => <DateText value={value} type="dateTime" />,
  input: { Component: Uu5Forms.FormDateTime, props: { required } },
});

/** Ano/ne sloupec — ikona místo `true`/`false`, aby tabulka nebyla plná anglických slov. */
const boolField = (labelPath) => ({
  label: labelPath,
  sort: true,
  output: (value) => (value ? "✓" : ""),
  columnProps: { maxWidth: 72, horizontalAlignment: "center" },
  input: { Component: Uu5Forms.FormSwitchSelect, props: { itemList: [{ value: false }, { value: true }] } },
});
//@@viewOff:sdílená pole

export {
  EntitySelect,
  EnumText,
  enumItemList,
  teamLabel,
  clubLabel,
  personLabel,
  seasonLabel,
  nameField,
  noteField,
  ageField,
  categoryField,
  categoryLabel,
  CategoryText,
  dateField,
  dateTimeField,
  boolField,
};
