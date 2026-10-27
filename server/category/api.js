import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, pageInfo } from "../services/validators.js";
import { roleAuth } from "../services/authorize.js";

// list/get jsou veřejné: web z kategorií skládá popisky mužstev a formulář týmu je otevírá
// i editorovi jednoho týmu (stejně jako `club/list`). Zapisuje jen správce (Caio 2026-10-26):
// kategorie určují, kdo proti komu smí hrát, a změna dopadá na všechny týmy.
const AUTH = roleAuth(Config.ADMIN);

const listDtoIn = shape({ pageInfo: pageInfo() });
const getDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  code: string(),
  name: string(),
  age: oneOf(Config.AGE_LIST),
});

export default {
  "category/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: () => crud.list().then((itemList) => ({ itemList })),
  },

  "category/get": {
    method: "get",
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.get(dtoIn.id),
  },

  "category/create": {
    method: "post",
    auth: AUTH,
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  "category/update": {
    method: "post",
    auth: AUTH,
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  "category/delete": {
    method: "post",
    auth: AUTH,
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
