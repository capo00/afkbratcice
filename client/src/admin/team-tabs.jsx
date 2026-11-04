import { Lsi, useMemo, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import { useApp } from "../core/app-context.jsx";
import DateText from "../components/date-text.jsx";

// Společné pro obrazovky, kde je záznam „kdo kde kdy“ -- Trenéři a výbor (`management`)
// a Hráči (`roster`): záložka za každý náš tým, sloupec a filtr Období a řazení s aktuálními
// nahoře.

const today = () => new Date().toISOString().slice(0, 10);

/** Překrývá se záznam s obdobím `[from, to]` (aspoň jeden společný den)? Chybějící mez je otevřená. */
function overlapsRange(m, [from, to] = []) {
  return (!m.dateFrom || !to || m.dateFrom <= to) && (!m.dateTo || !from || m.dateTo >= from);
}

/**
 * Chronologicky, aktuální nahoře: trvající (bez konce) první, pak podle konce sestupně, při
 * shodě podle začátku sestupně. Neznámý začátek je nejstarší.
 */
function compareRecent(a, b) {
  const aTo = a.dateTo ?? "9999-12-31";
  const bTo = b.dateTo ?? "9999-12-31";
  if (aTo !== bTo) return aTo < bTo ? 1 : -1;
  const aFrom = a.dateFrom ?? "";
  const bFrom = b.dateFrom ?? "";
  return aFrom === bFrom ? 0 : aFrom < bFrom ? 1 : -1;
}

/** „1. 9. 2007 – 30. 6. 2013“, „1. 9. 2002 – dosud“, bez začátku jen „– dosud“. */
function PeriodText({ dateFrom, dateTo }) {
  return (
    <>
      {dateFrom ? <DateText value={dateFrom} /> : null} –{" "}
      {dateTo ? <DateText value={dateTo} /> : <Lsi import={importLsi} path={["admin", "membership", "ongoing"]} />}
    </>
  );
}

/**
 * Sloupec, řazení a filtr Období a pole Od / Do do formuláře (klíče `period`, `dateFrom`,
 * `dateTo` konfigurace `UiElements.Crud`). `tieBreak(a, b)` rozhodne při stejném období.
 */
function periodFields({ tieBreak = () => 0 } = {}) {
  return {
    period: {
      label: lsi("admin", "field", "period"),
      output: (_, item) => <PeriodText {...item.data} />,
      sort: (_, __, a, b) => compareRecent(a.data, b.data) || tieBreak(a.data, b.data),
      filterProps: {
        inputType: "date-range",
        filter: (_, filterValue, item) => overlapsRange(item.data, filterValue),
      },
    },
    dateFrom: {
      label: lsi("admin", "membership", "dateFrom"),
      output: false,
      // Nový záznam začíná dnes -- to je stav, kvůli kterému ho někdo zakládá; při dopisování
      // historie se datum přepíše.
      input: {
        Component: Uu5Forms.FormDate,
        props: ({ operation }) => (operation === "create" ? { initialValue: today() } : {}),
      },
    },
    dateTo: {
      label: lsi("admin", "membership", "dateTo"),
      output: false,
      input: { Component: Uu5Forms.FormDate, props: {} },
    },
  };
}

/**
 * Záložky obrazovky: naše týmy v pořadí kategorií (všechny se jmenují „AFK Bratčice“,
 * rozliší je kategorie) a za nimi `extraTabList` (`[{ code, label }]`). Vybraná je
 * v adrese (`?tab=`), aby přežila obnovení stránky.
 *
 * @returns `{ activeTab, tabs }` -- `tabs` je element s přepínačem
 */
function useTeamTabs(extraTabList = []) {
  const { teamList, teamCategoryList, getCategory } = useApp();
  const [route, setRoute] = useRoute();

  const tabList = useMemo(() => {
    const order = (team) => {
      const i = teamCategoryList.findIndex((c) => c.code === team.category);
      return i < 0 ? Infinity : i;
    };
    const teams = teamList
      .filter((team) => team.own)
      .sort((a, b) => order(a) - order(b))
      .map((team) => ({ code: team.id, label: getCategory(team.category)?.name ?? team.name }));
    return [...teams, ...extraTabList];
  }, [teamList, teamCategoryList, getCategory, extraTabList]);

  const routeTab = route?.params?.tab;
  const activeTab = tabList.some((t) => t.code === routeTab) ? routeTab : tabList[0]?.code;

  const tabs = (
    <Uu5Elements.Tabs
      type="line"
      activeCode={activeTab}
      onChange={(e) => setRoute(route.uu5Route, { ...route.params, tab: e.data.activeCode }, { replace: true })}
      itemList={tabList}
      className={Config.Css.css({ marginBlockEnd: 16 })}
    />
  );

  return { activeTab, tabs };
}

export { today, overlapsRange, compareRecent, PeriodText, periodFields, useTeamTabs };
