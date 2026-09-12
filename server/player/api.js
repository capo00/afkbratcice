import Config from "../config.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, string, mongoId, oneOf, array, integer, any, pageInfo, truthy }
  from "../services/validators.js";
import { roleAuth, teamScoped } from "../services/authorize.js";

const membership = shape({ id: mongoId().isRequired(), dateFrom: any(), dateTo: any() });

const listDtoIn = shape({
  teamId: mongoId(),
  active: any(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

const idDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  personId: mongoId(),
  position: oneOf(Config.POSITION_LIST),
  number: integer(),
  teamList: array(membership),
  note: string(),
});

/** Týmy, kterých se dtoIn týká -- z teamList při zápisu, ze záznamu při úpravě. */
async function teamsOfPlayer(dtoIn) {
  if (dtoIn?.teamList?.length) return dtoIn.teamList.map((t) => t.id);
  if (dtoIn?.teamId) return [dtoIn.teamId];
  if (!dtoIn?.id) return [];
  const player = await dao.get(dtoIn.id).catch(() => null);
  return (player?.teamList ?? []).map((t) => t.id);
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

  "player/create": {
    method: "post",
    auth: teamScoped(teamsOfPlayer, Config.CONTENT, "all"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "player/update": {
    method: "post",
    auth: teamScoped(teamsOfPlayer, Config.CONTENT, "all"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  "player/addTeam": {
    method: "post",
    auth: teamScoped(async (dtoIn) => [dtoIn?.teamId], Config.CONTENT, "all"),
    validator: validate(shape({ id: mongoId().isRequired(), teamId: mongoId().isRequired(), dateFrom: string() })),
    fn: ({ dtoIn, identity }) => crud.addTeam(dtoIn, identity),
  },

  "player/endTeam": {
    method: "post",
    auth: teamScoped(async (dtoIn) => [dtoIn?.teamId], Config.CONTENT, "all"),
    validator: validate(shape({ id: mongoId().isRequired(), teamId: mongoId().isRequired(), dateTo: string() })),
    fn: ({ dtoIn, identity }) => crud.endTeam(dtoIn, identity),
  },

  "player/delete": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
