import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, array, pageInfo } from "../services/validators.js";
import { roleAuth } from "../services/authorize.js";

const listDtoIn = shape({
  age: oneOf(Config.AGE_LIST),
  teamId: mongoId(),
  yearFrom: string(),
  pageInfo: pageInfo(),
});

const getDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  competition: string(),
  yearFrom: string(),
  age: oneOf(Config.AGE_LIST),
  desc: string(),
  teamList: array(mongoId()),
});

export default {
  "season/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn }) => crud.list(dtoIn).then((itemList) => ({ itemList })),
  },

  "season/get": {
    method: "get",
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.get(dtoIn.id),
  },

  "season/getCurrent": {
    method: "get",
    validator: validate(shape({ age: oneOf(Config.AGE_LIST), teamId: mongoId() })),
    fn: ({ dtoIn }) => crud.getCurrent(dtoIn),
  },

  // Zdroj kategorií pro menu a routy -- kategorie nejsou nikde vyjmenované.
  "season/listCurrent": {
    method: "get",
    validator: validate(shape({ yearFrom: string() })),
    fn: ({ dtoIn }) => crud.listCurrent(dtoIn).then((itemList) => ({ itemList })),
  },

  "season/listYears": {
    method: "get",
    validator: validate(shape({})),
    fn: () => crud.listYears().then((itemList) => ({ itemList })),
  },

  "season/create": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  "season/update": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  "season/delete": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
