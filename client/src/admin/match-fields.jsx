import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import { EntitySelect, EnumText, enumItemList, dateTimeField, seasonLabel, teamLabel } from "./fields.jsx";

// Pole zápasu pro `UiElements.Crud`: sloupce, formulář i filtry obrazovky `admin/matches`.
// Zvlášť proto, že stejná pole edituje i rozbalovací sekce modalu „Zapsat výsledek"
// (`admin/match-modals.jsx`) -- dvě kopie by se rozešly.

// Filtry jdou **na server** (`match/list`), viz `listDtoIn` v `screens/matches.jsx`.
// Konec rozsahu až do konce dne: `time` je ISO s časem a „do 7. 6.“ má vzít i zápas v 17:00.
const dateRangeDtoIn = ([from, to] = []) => ({
  ...(from ? { dateFrom: from } : null),
  ...(to ? { dateTo: `${to}T23:59:59.999Z` } : null),
});

// Formulář zápasu -- nový zápas na obrazovce Zápasy i záložka Info modalu -- má pořadí podle
// obrazovky, ne podle sloupců tabulky (Caio 2026-11-10): sezóna a kolo, termín a stav, domácí
// a hosté, hřiště a odjezd, poznámka přes celou šířku. `generateInputs` vykresluje pole
// v pořadí konfigurace, proto se konfigurace pro formulář přeřadí (`matchFormConfig`) a
// tabulátor jde stejně jako oko. Pořadí sloupců zůstává z `getMatchConfig`.
const MATCH_FORM_FIELD_LIST = ["seasonId", "round", "time", "state", "homeTeamId", "guestTeamId", "place", "departureTime", "note"];

/** Dvojice polí vedle sebe od `s` výš (`formGridLayout`). */
const MATCH_PAIR_LIST = [["seasonId", "round"], ["time", "state"], ["homeTeamId", "guestTeamId"], ["place", "departureTime"]];

/** Jen pole formuláře, v pořadí `nameList`; chybějící klíče se přeskočí. */
function matchFormConfig(cfg, nameList = MATCH_FORM_FIELD_LIST) {
  return Object.fromEntries(nameList.filter((name) => cfg[name]).map((name) => [name, cfg[name]]));
}

/**
 * @param getTeam         tým podle id z app-contextu (název ve sloupci)
 * @param teamItemList    nabídka filtrů Domácí/Hosté
 * @param seasonItemList  nabídka filtru Sezóna
 */
function getMatchConfig({ getTeam, teamItemList = [], seasonItemList = [] }) {
  return {
    time: {
      ...dateTimeField(lsi("admin", "field", "time"), { required: false }),
      filterProps: { inputType: "date-range", dtoIn: dateRangeDtoIn },
    },
    homeTeamId: {
      label: lsi("admin", "field", "homeTeam"),
      output: (value) => getTeam(value)?.name ?? value,
      input: {
        Component: EntitySelect,
        props: { required: true, useCase: "/team/list", getLabel: teamLabel },
      },
      filterProps: {
        inputType: "text-select",
        inputProps: { itemList: teamItemList },
        dtoIn: (homeTeamId) => ({ homeTeamId }),
      },
    },
    guestTeamId: {
      label: lsi("admin", "field", "guestTeam"),
      output: (value) => getTeam(value)?.name ?? value,
      input: {
        Component: EntitySelect,
        props: { required: true, useCase: "/team/list", getLabel: teamLabel },
      },
      filterProps: {
        inputType: "text-select",
        inputProps: { itemList: teamItemList },
        dtoIn: (guestTeamId) => ({ guestTeamId }),
      },
    },
    // Skóre je jen sloupec: mění se přes „Zapsat výsledek", který navíc hlídá rozstřel.
    homeGoals: {
      label: lsi("admin", "field", "score"),
      columnProps: { maxWidth: 90, horizontalAlignment: "center" },
      output: (value, item) =>
        Number.isFinite(value) && Number.isFinite(item.data.guestGoals) ? `${value} : ${item.data.guestGoals}` : "",
    },
    seasonId: {
      label: lsi("admin", "field", "season"),
      output: false,
      input: {
        Component: EntitySelect,
        props: { required: true, useCase: "/season/list", getLabel: seasonLabel },
      },
      filterProps: {
        inputType: "text-select",
        inputProps: { itemList: seasonItemList },
        dtoIn: (seasonId) => ({ seasonId }),
      },
    },
    round: {
      label: lsi("admin", "field", "round"),
      sort: true,
      columnProps: { maxWidth: 80, horizontalAlignment: "center" },
      // Prázdné kolo = přátelský zápas; server prázdný řetězec normalizuje na null.
      input: { Component: Uu5Forms.FormText, props: { maxLength: 5 } },
      filterProps: {
        label: lsi("admin", "matches", "roundFilter"),
        inputType: "text",
        dtoIn: (round) => ({ round: String(round).trim() }),
      },
    },
    place: {
      label: lsi("admin", "field", "place"),
      input: { Component: Uu5Forms.FormText, props: { maxLength: 80 } },
    },
    departureTime: {
      label: lsi("admin", "field", "departureTime"),
      output: false,
      input: { Component: Uu5Forms.FormDateTime, props: {} },
    },
    state: {
      label: lsi("admin", "field", "state"),
      sort: true,
      columnProps: { maxWidth: 120 },
      output: (value) => <EnumText enumName="matchState" code={value} />,
      input: {
        Component: Uu5Forms.FormSelect,
        props: { itemList: enumItemList("matchState", Config.MATCH_STATE_LIST) },
      },
      filterProps: {
        inputType: "select",
        inputProps: { itemList: enumItemList("matchState", Config.MATCH_STATE_LIST) },
        dtoIn: (state) => ({ state }),
      },
    },
    note: {
      label: lsi("admin", "field", "note"),
      output: false,
      input: { Component: Uu5Forms.FormTextArea, props: { maxLength: 300, autoResize: true } },
    },
  };
}

export { getMatchConfig, matchFormConfig, MATCH_FORM_FIELD_LIST, MATCH_PAIR_LIST };
