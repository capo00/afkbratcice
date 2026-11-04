import { createVisualComponent, Lsi, useMemo } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import { UiElements } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../screen.jsx";
import { EntitySelect, EnumText, enumItemList, noteField, personLabel } from "../fields.jsx";
import { useApp } from "../../core/app-context.jsx";
import CrudFormView from "../crud-form-view.jsx";
import FormPersonSelect from "../form-person-select.jsx";
import { periodFields, useTeamTabs } from "../team-tabs.jsx";

// Hráči. Hráč není osoba -- je to **karta osoby jako hráče** (osoba, post, poznámka); na její
// id stojí sestavy zápasů, statistiky a stránka hráče. Kdy byl v jakém týmu, je **soupiska**:
// záznam = hráč v týmu v období (`roster`, design/data-model.md, sekce 6.1).
//
// Záložka za každý náš tým ukazuje jeho soupisku (aktuální nahoře), poslední záložka karty
// hráčů. Hráč na soupisku přidává z existujících karet; karta se zakládá na své záložce.
// Číslo dresu se od 2026-11 neeviduje.

const [RosterProvider] = UiElements.CrudContext.create("roster");
const [PlayerProvider] = UiElements.CrudContext.create("player");
// Bez `createMany`/`deleteMany` -- ani jedna entita je na serveru nemá (caio-ui `CrudContext.entityCalls`).
const ROSTER_CALLS = UiElements.CrudContext.entityCalls("roster");
const PLAYER_CALLS = UiElements.CrudContext.entityCalls("player");

const CARDS = "cards";
const ERROR_LSI = lsi("errors");
const POSITION_ITEM_LIST = enumItemList("position", Config.POSITION_LIST);
const INITIAL_SORTER_LIST = [{ key: "period", ascending: true }];

const positionOrder = (code) => {
  const i = Config.POSITION_LIST.indexOf(code);
  return i < 0 ? Infinity : i;
};
const playerText = (player) => (player?.person ? personLabel(player.person) : (player?.id ?? ""));

/** Možnosti filtru podle osoby: ty, které na záložce jsou, každá jednou, podle abecedy. */
function useItemList(dataList, getKey, getLabel) {
  const key = (dataList.data ?? []).map((item) => item?.data && getKey(item.data)).join(",");
  return useMemo(() => {
    const byKey = new Map();
    for (const item of dataList.data ?? []) {
      const k = item?.data && getKey(item.data);
      if (k && !byKey.has(k)) byKey.set(k, getLabel(item.data));
    }
    return [...byKey.entries()]
      .sort(([, a], [, b]) => String(a).localeCompare(String(b), "cs"))
      .map(([value, children]) => ({ value, children }));
  }, [key]);
}

//@@viewOn:soupiska
function getRosterConfig({ playerItemList }) {
  return {
    playerId: {
      label: lsi("admin", "field", "player"),
      output: (_, item) => playerText(item.data.player),
      sort: (_, __, a, b) => playerText(a.data.player).localeCompare(playerText(b.data.player), "cs"),
      input: {
        Component: EntitySelect,
        props: { required: true, searchable: true, useCase: "/player/list", getLabel: playerText },
      },
      filterProps: {
        inputType: "text-select",
        inputProps: { itemList: playerItemList },
        filter: (value, filterValue) => value === filterValue,
      },
    },
    // Post je na kartě hráče, tady jen ke čtení.
    position: {
      label: lsi("admin", "field", "position"),
      output: (_, item) => <EnumText enumName="position" code={item.data.player?.position} />,
      sort: (_, __, a, b) => positionOrder(a.data.player?.position) - positionOrder(b.data.player?.position),
      filterProps: {
        inputType: "select",
        inputProps: { itemList: POSITION_ITEM_LIST },
        filter: (_, filterValue, item) => item.data.player?.position === filterValue,
      },
    },
    // Období, Od, Do. Při stejném období podle jména.
    ...periodFields({ tieBreak: (a, b) => playerText(a.player).localeCompare(playerText(b.player), "cs") }),
  };
}

// Modal: hráč na celou šířku, pod ním od–do (od `s`); na telefonu pod sebou.
const ROSTER_PAIR_LIST = [["dateFrom", "dateTo"]];

function RosterTable({ dataList }) {
  const playerItemList = useItemList(
    dataList,
    (d) => d.playerId,
    (d) => playerText(d.player),
  );
  const { cfg, seriesList, columnList, sorterList, filterList } = useMemo(() => {
    const cfg = getRosterConfig({ playerItemList });
    return { cfg, ...UiElements.Crud.generate(cfg) };
  }, [playerItemList]);

  return (
    <UiElements.Crud
      dataList={dataList}
      seriesList={seriesList}
      columnList={columnList}
      sorterDefinitionList={sorterList}
      initialSorterList={INITIAL_SORTER_LIST}
      filterDefinitionList={filterList}
      lsiError={ERROR_LSI}
    >
      {({ type }) => <CrudFormView cfg={cfg} operation={type} pairList={ROSTER_PAIR_LIST} />}
    </UiElements.Crud>
  );
}

/** Soupiska jednoho týmu; nový záznam dostane tým ze záložky. */
function RosterTab({ teamId }) {
  const dtoIn = useMemo(() => ({ teamId }), [teamId]);
  const calls = useMemo(
    () => ({ ...ROSTER_CALLS, createItem: (data) => ROSTER_CALLS.createItem({ ...data, teamId }) }),
    [teamId],
  );
  return (
    <RosterProvider calls={calls} dtoIn={dtoIn}>
      {(dataList) => <RosterTable dataList={dataList} />}
    </RosterProvider>
  );
}
//@@viewOff:soupiska

//@@viewOn:karty hráčů
/** Týmy, ve kterých hráč dnes je (kategorie, „A (Muži), U19“). */
function ActiveTeams({ teamList }) {
  const { getTeam, getCategory } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  return (teamList ?? [])
    .filter((m) => (!m.dateFrom || m.dateFrom <= today) && (!m.dateTo || m.dateTo >= today))
    .map((m) => {
      const team = getTeam(m.id);
      return getCategory(team?.category)?.name ?? team?.name ?? m.id;
    })
    .join(", ");
}

function getCardConfig({ teamItemList }) {
  return {
    personId: {
      label: lsi("admin", "field", "person"),
      output: (value, item) => (item.data.person ? personLabel(item.data.person) : value),
      sort: (_, __, a, b) => playerText(a.data).localeCompare(playerText(b.data), "cs"),
      input: { Component: FormPersonSelect, props: { required: true } },
    },
    position: {
      label: lsi("admin", "field", "position"),
      output: (value) => <EnumText enumName="position" code={value} />,
      sort: (a, b) => positionOrder(a) - positionOrder(b),
      input: { Component: Uu5Forms.FormSelect, props: { itemList: POSITION_ITEM_LIST } },
      filterProps: {
        inputType: "select",
        inputProps: { itemList: POSITION_ITEM_LIST },
        filter: (value, filterValue) => value === filterValue,
      },
    },
    // Odvozené ze soupisky (server), jen ke čtení; filtr = hráč v týmu dnes.
    teamList: {
      label: lsi("admin", "field", "activeTeamList"),
      output: (value) => <ActiveTeams teamList={value} />,
      filterProps: {
        inputType: "select",
        inputProps: { itemList: teamItemList },
        filter: (value, filterValue) => {
          const today = new Date().toISOString().slice(0, 10);
          return (value ?? []).some(
            (m) => m.id === filterValue && (!m.dateFrom || m.dateFrom <= today) && (!m.dateTo || m.dateTo >= today),
          );
        },
      },
    },
    note: noteField,
  };
}

function CardsTab() {
  const { teamList, getCategory } = useApp();
  const teamItemList = useMemo(
    () =>
      teamList
        .filter((team) => team.own)
        .map((team) => ({ value: team.id, children: getCategory(team.category)?.name ?? team.name })),
    [teamList, getCategory],
  );
  const { cfg, seriesList, columnList, sorterList, filterList } = useMemo(() => {
    const cfg = getCardConfig({ teamItemList });
    return { cfg, ...UiElements.Crud.generate(cfg) };
  }, [teamItemList]);

  return (
    <PlayerProvider calls={PLAYER_CALLS}>
      {(dataList) => (
        <UiElements.Crud
          dataList={dataList}
          seriesList={seriesList}
          columnList={columnList}
          sorterDefinitionList={sorterList}
          filterDefinitionList={filterList}
          lsiError={ERROR_LSI}
        >
          {({ type }) => <CrudFormView cfg={cfg} operation={type} />}
        </UiElements.Crud>
      )}
    </PlayerProvider>
  );
}
//@@viewOff:karty hráčů

const EXTRA_TAB_LIST = [{ code: CARDS, label: <Lsi import={importLsi} path={["admin", "players", "cards"]} /> }];

const AdminPlayers = createVisualComponent({
  uu5Tag: Config.TAG + "AdminPlayers",

  render() {
    const { activeTab, tabs } = useTeamTabs(EXTRA_TAB_LIST);

    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "players", "header")}>
        {tabs}
        {activeTab === CARDS ? <CardsTab /> : activeTab ? <RosterTab key={activeTab} teamId={activeTab} /> : null}
      </AdminScreen>
    );
  },
});

export default AdminPlayers;
