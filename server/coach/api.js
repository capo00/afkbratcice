import Config from "../config.js";
import crud from "./crud.js";
import dao from "./dao.js";
import { validate, shape, mongoId, oneOf, array, any, pageInfo, truthy } from "../services/validators.js";
import { roleAuth, teamScoped } from "../services/authorize.js";

const membership = shape({ id: mongoId().isRequired(), dateFrom: any(), dateTo: any() });
const idDtoIn = shape({ id: mongoId().isRequired() });

const listDtoIn = shape({
  teamId: mongoId(),
  role: oneOf(Config.COACH_ROLE),
  active: any(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

const writeDtoIn = shape({
  id: mongoId(),
  personId: mongoId(),
  role: oneOf(Config.COACH_ROLE),
  teamList: array(membership),
});

async function teamsOfCoach(dtoIn) {
  if (dtoIn?.teamList?.length) return dtoIn.teamList.map((t) => t.id);
  if (!dtoIn?.id) return [];
  const coach = await dao.get(dtoIn.id).catch(() => null);
  return (coach?.teamList ?? []).map((t) => t.id);
}

export default {
  "coach/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn, identity }) =>
      crud.list({ ...dtoIn, active: truthy(dtoIn.active) }, identity).then((itemList) => ({ itemList })),
  },

  "coach/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  "coach/create": {
    method: "post",
    auth: teamScoped(teamsOfCoach, Config.CONTENT, "all"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "coach/update": {
    method: "post",
    auth: teamScoped(teamsOfCoach, Config.CONTENT, "all"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.update(dtoIn, identity),
  },

  "coach/delete": {
    method: "post",
    auth: teamScoped(teamsOfCoach, Config.CONTENT, "all"),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
