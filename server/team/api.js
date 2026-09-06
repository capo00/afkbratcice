import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, array, boolean, any, pageInfo, truthy } from "../services/validators.js";
import { teamScoped, roleAuth } from "../services/authorize.js";

const listDtoIn = shape({
  age: oneOf(Config.AGE_LIST),
  own: any(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

const getDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  name: string(),
  shortName: string(),
  age: oneOf(Config.AGE_LIST),
  own: boolean(),
  // File dorazí z multipart/form-data; `null` znamená "smazat logo".
  logo: any(),
});

export default {
  "team/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn }) => crud.list({ ...dtoIn, own: dtoIn.own === undefined ? undefined : truthy(dtoIn.own) })
      .then((itemList) => ({ itemList })),
  },

  "team/get": {
    method: "get",
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.get(dtoIn.id),
  },

  "team/create": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  // Editor týmu smí upravit svůj tým (logo, název, zkratku).
  "team/update": {
    method: "post",
    auth: teamScoped(async (dtoIn) => [dtoIn?.id], Config.CONTENT, "all"),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  "team/delete": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
