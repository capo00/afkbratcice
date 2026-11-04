import { Authorization } from "caio-server";
import Config from "../config.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, mongoId, any, truthy } from "../services/validators.js";

// Soupiska: hráč v týmu v období. Editor týmu píše jen do soupisky svého týmu.

const listDtoIn = shape({
  teamId: mongoId(),
  playerId: mongoId(),
  active: any(),
  seasonId: mongoId(),
});
const idDtoIn = shape({ id: mongoId().isRequired() });
const createDtoIn = shape({
  playerId: mongoId().isRequired(),
  teamId: mongoId().isRequired(),
  dateFrom: any(),
  dateTo: any(),
});
// Bez `teamId`: editor týmu A by jinak působení „převedl“ do svého týmu.
const updateDtoIn = shape({ id: mongoId().isRequired(), playerId: mongoId(), dateFrom: any(), dateTo: any() });

/** Tým zápisu: u `create` z dtoIn, jinak uložený. */
async function teamOfRow({ dtoIn }) {
  if (!dtoIn?.id) return dtoIn?.teamId ? [dtoIn.teamId] : [];
  const current = await dao.get(dtoIn.id).catch(() => null);
  return current?.teamId ? [current.teamId] : [];
}

const writeAuth = Authorization.auth(Config.CONTENT, {
  role: Config.ROLE.TEAM_EDITOR,
  resolve: teamOfRow,
  mode: "all",
});

export default {
  "roster/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn, identity }) =>
      crud.list({ ...dtoIn, active: truthy(dtoIn.active) }, identity).then((itemList) => ({ itemList })),
  },

  "roster/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  "roster/create": {
    method: "post",
    auth: writeAuth,
    validator: validate(createDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "roster/update": {
    method: "post",
    auth: writeAuth,
    validator: validate(updateDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  "roster/delete": {
    method: "post",
    auth: writeAuth,
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
