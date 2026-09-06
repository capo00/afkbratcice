import Config from "../config.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, string, mongoId, oneOf, array, integer, boolean, any, pageInfo }
  from "../services/validators.js";
import { teamScoped, roleAuth } from "../services/authorize.js";

const listDtoIn = shape({
  seasonId: mongoId(),
  teamId: mongoId(),
  teamIdList: array(mongoId()),
  opponentId: mongoId(),
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
  substitute: boolean(),
  goals: integer(),
  yellowCard: boolean(),
  redCard: boolean(),
});

const writeDtoIn = shape({
  id: mongoId(),
  seasonId: mongoId(),
  round: string(),
  time: string(),
  place: string(),
  departureTime: string(),
  homeTeamId: mongoId(),
  guestTeamId: mongoId(),
  homeGoals: integer(),
  guestGoals: integer(),
  homeGoalsHalf: integer(),
  guestGoalsHalf: integer(),
  penaltyWinnerTeamId: mongoId(),
  playerList: array(lineupEntry),
  state: oneOf(Config.MATCH_STATE),
  note: string(),
});

/** Týmy zápasu podle uloženého záznamu -- dtoIn u update nese jen `id`. */
async function teamsOfMatch(dtoIn) {
  const match = await dao.get(dtoIn?.id).catch(() => null);
  return match ? [match.homeTeamId, match.guestTeamId] : [];
}

export default {
  "match/list": {
    method: "get",
    validator: validate(listDtoIn),
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
    auth: teamScoped(async (dtoIn) => [dtoIn?.homeTeamId, dtoIn?.guestTeamId], Config.MATCH, "any"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  // Hromadný import rozlosování z OFS -- jen plošné role.
  "match/createMany": {
    method: "post",
    auth: roleAuth(Config.MATCH),
    validator: validate(shape({ itemList: array(writeDtoIn).isRequired() })),
    fn: ({ dtoIn }) => crud.createMany(dtoIn.itemList).then((itemList) => ({ itemList })),
  },

  "match/update": {
    method: "post",
    auth: teamScoped(teamsOfMatch, Config.MATCH, "any"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  // Výsledek smí zapsat editor kteréhokoli z obou týmů -- byli u toho oba.
  "match/setResult": {
    method: "post",
    auth: teamScoped(teamsOfMatch, Config.MATCH, "any"),
    validator: validate(shape({
      id: mongoId().isRequired(),
      homeGoals: integer().isRequired(),
      guestGoals: integer().isRequired(),
      homeGoalsHalf: integer(),
      guestGoalsHalf: integer(),
      penaltyWinnerTeamId: any(),
    })),
    fn: ({ dtoIn }) => crud.setResult(dtoIn),
  },

  "match/setLineup": {
    method: "post",
    auth: teamScoped(teamsOfMatch, Config.MATCH, "any"),
    validator: validate(shape({ id: mongoId().isRequired(), playerList: array(lineupEntry) })),
    fn: ({ dtoIn, identity }) => crud.setLineup(dtoIn, identity),
  },

  // Mazání zápasu je zásah do soutěže, ne do vlastního týmu -- teamEditor ne.
  "match/delete": {
    method: "post",
    auth: roleAuth(Config.MATCH),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },

  "match/deleteMany": {
    method: "post",
    auth: roleAuth(Config.MATCH),
    validator: validate(shape({ idList: array(mongoId()).isRequired() })),
    fn: ({ dtoIn }) => crud.deleteMany(dtoIn.idList).then(() => ({})),
  },
};
