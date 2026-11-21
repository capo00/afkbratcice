import { Authorization } from "caio-server";
import Config from "../config.js";
import { LINEUP_POSITION_LIST } from "../services/lineup-position.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, string, mongoId, oneOf, array, integer, boolean, datetime, any, pageInfo }
  from "../services/validators.js";

const listDtoIn = shape({
  seasonId: mongoId(),
  teamId: mongoId(),
  teamIdList: array(mongoId()),
  opponentId: mongoId(),
  homeTeamId: mongoId(),
  guestTeamId: mongoId(),
  playerId: mongoId(),
  round: string(),
  state: oneOf(Config.MATCH_STATE),
  dateFrom: string(),
  dateTo: string(),
  order: oneOf(["asc", "desc"]),
  pageInfo: pageInfo(),
});

const idDtoIn = shape({ id: mongoId().isRequired() });

const lineupEntry = shape({
  playerId: mongoId().isRequired(),
  position: oneOf(Config.POSITION_LIST),
  // Přesný post (services/lineup-position.js); `position` se z něj dopočítá.
  positionDetail: oneOf(LINEUP_POSITION_LIST),
  substitute: boolean(),
  goals: integer(),
  yellowCard: boolean(),
  redCard: boolean(),
});

// Match info -- what the "Info" tab of the match modal edits. The result and the lineup are NOT
// accepted by `match/create` and `match/update`: they have their own use cases with their own
// rules (`setResult` checks the penalty shootout, `setLineup` keeps a team editor to their own
// players). The validator drops unknown keys with a warning, so an older client keeps working,
// it just cannot bypass those rules (review 2026-11-12, V1).
const infoFields = {
  id: mongoId(),
  seasonId: mongoId(),
  round: string(),
  time: string(),
  place: string(),
  // ISO; server ho posadí na den zápasu (`match/crud.js`, `_withDeparture`).
  departureTime: datetime(),
  homeTeamId: mongoId(),
  guestTeamId: mongoId(),
  state: oneOf(Config.MATCH_STATE),
  // BACKWARD-COMPAT: `note`, not `desc` (the rule for new fields). The field holds data migrated
  // from v0 and the client writes it; renaming it is a migration, done only when asked (review 1.3).
  note: string(),
};

const infoDtoIn = shape(infoFields);

// One match of the fixture import (`match/createMany`, broad roles only): the info plus the
// result, so already played rounds can be imported too. The result goes through the same check
// as `match/setResult` (crud.js `_checkResult`). No lineup -- the import does not carry one.
const importEntryDtoIn = shape({
  ...infoFields,
  homeGoals: integer(),
  guestGoals: integer(),
  homeGoalsHalf: integer(),
  guestGoalsHalf: integer(),
  penaltyWinnerTeamId: mongoId(),
});

// Filters that narrow the matches; `match/list` needs at least one (`validateList`).
// `opponentId` is not one: the dao applies it only together with `teamId`.
const LIST_FILTER_KEY_LIST = ["seasonId", "teamId", "teamIdList", "homeTeamId", "guestTeamId", "playerId", "dateFrom", "dateTo"];

/**
 * Bez filtru by výpis byl celá historie (1000 zápasů na volání, 677 kB) -- hromadný export,
 * který web nepotřebuje a kdokoli ho může opakovat. Aspoň jeden filtr, který zápasy zúží, je
 * proto povinný (review 2026-11-12, S12; Caio 2026-11-16). `state`, `round`, `order`
 * a `pageInfo` se nepočítají: řadí, stránkují nebo zpřesňují, ale nechají celou historii.
 *
 * Kolo je číslo v rámci soutěže: „5. kolo“ bez sezóny by spojilo pátá kola všech soutěží
 * a ročníků, což nikdo nechce. Proto jen se `seasonId`.
 */
function validateList(input) {
  const dtoIn = validate(listDtoIn)(input);
  if (!LIST_FILTER_KEY_LIST.some((key) => (Array.isArray(dtoIn[key]) ? dtoIn[key].length : dtoIn[key]))) {
    const e = new Error("Invalid dtoIn: at least one filter is required");
    e.errors = [{ path: [], message: `requires one of ${LIST_FILTER_KEY_LIST.join(", ")}` }];
    throw e;
  }
  if (dtoIn.round && !dtoIn.seasonId) {
    const e = new Error("Invalid dtoIn: round requires seasonId");
    e.errors = [{ path: ["round"], message: "requires seasonId" }];
    throw e;
  }
  return dtoIn;
}

/** Týmy zápasu podle uloženého záznamu -- dtoIn u update nese jen `id`. */
async function teamsOfMatch({ dtoIn }) {
  const match = await dao.get(dtoIn?.id).catch(() => null);
  return match ? [match.homeTeamId, match.guestTeamId] : [];
}

export default {
  "match/list": {
    method: "get",
    validator: validateList,
    fn: ({ dtoIn, identity }) => crud.list(dtoIn, identity).then((itemList) => ({ itemList })),
  },

  "match/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  "match/getLast": {
    method: "get",
    validator: validate(shape({ teamId: mongoId().isRequired() })),
    fn: ({ dtoIn, identity }) => crud.getLast(dtoIn.teamId, identity),
  },

  "match/getNext": {
    method: "get",
    validator: validate(shape({ teamId: mongoId().isRequired() })),
    fn: ({ dtoIn, identity }) => crud.getNext(dtoIn.teamId, identity),
  },

  // Editor týmu smí založit zápas, ve kterém jeho tým hraje -- proto "any" ze dvou.
  "match/create": {
    method: "post",
    auth: Authorization.auth(Config.MATCH, {
      role: Config.ROLE.TEAM_EDITOR,
      resolve: ({ dtoIn }) => [dtoIn?.homeTeamId, dtoIn?.guestTeamId],
      mode: "any",
    }),
    validator: validate(infoDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  // Hromadný import rozlosování z OFS -- jen plošné role.
  "match/createMany": {
    method: "post",
    auth: Authorization.auth(Config.MATCH),
    validator: validate(shape({ itemList: array(importEntryDtoIn).isRequired() })),
    fn: ({ dtoIn }) => crud.createMany(dtoIn.itemList).then((itemList) => ({ itemList })),
  },

  "match/update": {
    method: "post",
    auth: Authorization.auth(Config.MATCH, {
      role: Config.ROLE.TEAM_EDITOR,
      resolve: teamsOfMatch,
      mode: "any",
    }),
    validator: validate(infoDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  // Výsledek smí zapsat editor kteréhokoli z obou týmů -- byli u toho oba. Prázdné skóre
  // (oba góly `null`) výsledek smaže -- odložený ani zrušený zápas ho mít nemusí (Caio 2026-11-21).
  "match/setResult": {
    method: "post",
    auth: Authorization.auth(Config.MATCH, {
      role: Config.ROLE.TEAM_EDITOR,
      resolve: teamsOfMatch,
      mode: "any",
    }),
    validator: validate(shape({
      id: mongoId().isRequired(),
      homeGoals: integer(),
      guestGoals: integer(),
      homeGoalsHalf: integer(),
      guestGoalsHalf: integer(),
      penaltyWinnerTeamId: any(),
    })),
    fn: ({ dtoIn, identity }) => crud.setResult(dtoIn, identity),
  },

  "match/setLineup": {
    method: "post",
    auth: Authorization.auth(Config.MATCH, {
      role: Config.ROLE.TEAM_EDITOR,
      resolve: teamsOfMatch,
      mode: "any",
    }),
    // `teamId` (optional): replace only the lineup of this team of the match (its roster on the
    // match day) and keep every other entry -- the match modal edits one team (crud.js).
    validator: validate(shape({ id: mongoId().isRequired(), playerList: array(lineupEntry), teamId: mongoId() })),
    fn: ({ dtoIn, identity }) => crud.setLineup(dtoIn, identity),
  },

  // Mazání zápasu je zásah do soutěže, ne do vlastního týmu -- teamEditor ne.
  "match/delete": {
    method: "post",
    auth: Authorization.auth(Config.MATCH),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },

  "match/deleteMany": {
    method: "post",
    auth: Authorization.auth(Config.MATCH),
    validator: validate(shape({ idList: array(mongoId()).isRequired() })),
    fn: ({ dtoIn }) => crud.deleteMany(dtoIn.idList).then(() => ({})),
  },
};
