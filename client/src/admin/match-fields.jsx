import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import { EntitySelect, EnumText, enumItemList, dateTimeField, teamLabel } from "./fields.jsx";
import { seasonName } from "../core/season-label.js";
import DepartureTimeInput from "./departure-time-input.jsx";

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

// Hodnota filtru Tým „Moje týmy“: všechny týmy správce týmu najednou (`teamIdList`).
const MY_TEAMS = "mine";

/**
 * @param getTeam            tým podle id z app-contextu (název ve sloupci)
 * @param teamItemList       nabídka filtrů Domácí/Hosté
 * @param seasonItemList     nabídka filtru Sezóna
 * @param ownTeamItemList    nabídka filtru Tým: naše týmy (správci týmu jen jeho a „Moje týmy“)
 * @param myTeamIdList       týmy správce týmu pro „Moje týmy“; plošná role `null`
 * @param getOwnTeamLabel    náš tým zápasu do sloupce Náš tým (kategorie: „A (Muži)“, „U15“)
 * @param getSeasonLabel     sezóna do sloupce (soutěž a ročník)
 */
function getMatchConfig({
  getTeam,
  teamItemList = [],
  seasonItemList = [],
  ownTeamItemList = [],
  myTeamIdList = null,
  getOwnTeamLabel = () => "",
  getSeasonLabel = () => "",
}) {
  return {
    time: {
      ...dateTimeField(lsi("admin", "field", "time"), { required: false }),
      // Required (uu5tiles: cannot be removed, only changed): `match/list` refuses a list
      // without a filter (review S12) and the date is the one that fits every task -- the
      // weekend's results across all teams included. Default range in `screens/matches.jsx`.
      filterProps: { inputType: "date-range", dtoIn: dateRangeDtoIn, required: true },
    },
    // Náš tým zápasu a filtr podle něj (doma i venku, `match/list` `teamId`). Bez něj byl seznam
    // dva tisíce zápasů všech týmů a nebylo poznat, který je čí (review 2026-11-12, kap. 3.1).
    teamId: {
      label: lsi("admin", "field", "ownTeam"),
      columnProps: { maxWidth: 140 },
      output: (_, item) => getOwnTeamLabel(item.data),
      filterProps: {
        inputType: "text-select",
        inputProps: { itemList: ownTeamItemList },
        dtoIn: (teamId) => (teamId === MY_TEAMS ? { teamIdList: myTeamIdList ?? [] } : { teamId }),
      },
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
    // Sloupec: soutěž a ročník („III. třída 2026/27“), ať je vidět, o jakou soutěž jde.
    seasonId: {
      label: lsi("admin", "field", "season"),
      output: (value, item) => getSeasonLabel(item.data) || "",
      input: {
        Component: EntitySelect,
        props: { required: true, useCase: "/season/list", getLabel: seasonName },
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
      // Jen čas, datum je den zápasu (Caio 2026-11-18).
      input: { Component: DepartureTimeInput, props: {} },
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

export { getMatchConfig, matchFormConfig, MATCH_FORM_FIELD_LIST, MATCH_PAIR_LIST, MY_TEAMS };
