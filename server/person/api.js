import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, array, any, pageInfo } from "../services/validators.js";
import { roleAuth, anyTeamEditor } from "../services/authorize.js";

const listDtoIn = shape({ query: string(), idList: array(mongoId()), pageInfo: pageInfo() });
const idDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  name: string(),
  surname: string(),
  birthdate: string(),
  email: string(),
  phone: string(),
  identity: string(),
  note: string(),
  photo: any(),
});

export default {
  "person/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn, identity }) => crud.list(dtoIn, identity).then((itemList) => ({ itemList })),
  },

  "person/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  // Editor týmu smí osobu ZALOŽIT (aby doplnil soupisku), ale editovat a mazat už ne --
  // osoba může hrát za víc týmů a patří tak celému klubu.
  "person/create": {
    method: "post",
    auth: anyTeamEditor(Config.CONTENT),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  "person/update": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  "person/delete": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },

  "person/linkIdentity": {
    method: "post",
    auth: roleAuth(Config.ADMIN),
    validator: validate(shape({ id: mongoId().isRequired(), identity: string().isRequired() })),
    fn: ({ dtoIn }) => crud.linkIdentity(dtoIn),
  },
};
