import { Authorization } from "caio-server";
import Config from "../config.js";
import crud from "./crud.js";
import rosterDao from "../roster/dao.js";
import { validate, shape, string, mongoId, oneOf, array, any, pageInfo, truthy } from "../services/validators.js";

const listDtoIn = shape({
  teamId: mongoId(),
  active: any(),
  seasonId: mongoId(),
  // Roster on one day (YYYY-MM-DD); the match lineup offers the players of the match day.
  date: string(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

const idDtoIn = shape({ id: mongoId().isRequired() });

// Karta hráče: osoba, post, poznámka. V týmech je hráč přes soupisku (`roster/*`).
const writeDtoIn = shape({
  id: mongoId(),
  personId: mongoId(),
  position: oneOf(Config.POSITION_LIST),
  note: string(),
});

/** Týmy hráče ze soupisky (kdykoli) -- editor týmu smí kartu hráče, který je jen jeho. */
async function teamsOfPlayer({ dtoIn }) {
  if (!dtoIn?.id) return [];
  const rowList = await rosterDao.listByFilter({ playerId: dtoIn.id }).catch(() => []);
  return [...new Set(rowList.map((r) => r.teamId))];
}

export default {
  "player/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn, identity }) =>
      crud.list({ ...dtoIn, active: truthy(dtoIn.active) }, identity).then((itemList) => ({ itemList })),
  },

  "player/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  // Karta týmu nepatří, takže ji smí založit kterýkoli editor týmu -- jako osobu (`person/create`).
  // Do svého týmu ho pak dá přes `roster/create`.
  "player/create": {
    method: "post",
    auth: Authorization.auth([...Config.CONTENT, Config.ANY_TEAM_EDITOR]),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "player/update": {
    method: "post",
    auth: Authorization.auth(Config.CONTENT, {
      role: Config.ROLE.TEAM_EDITOR,
      resolve: teamsOfPlayer,
      mode: "all",
    }),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  "player/delete": {
    method: "post",
    auth: Authorization.auth(Config.CONTENT),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
