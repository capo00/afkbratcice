import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, any, pageInfo } from "../services/validators.js";
import { roleAuth } from "../services/authorize.js";

// list/get jsou veřejné jako `team/list`/`team/get` -- na webu se sice pořád čte jen
// denormalizované `team.logoUri`, ale výběr klubu ve formuláři týmu (`admin/teams.jsx`)
// otevírá i `teamEditor:<id>`, který na `Config.CONTENT` nemá dosah (design/roles.md, 5.2).
// Klub navíc nenese nic neveřejného -- jen jméno a erb.
const AUTH = roleAuth(Config.CONTENT);

const listDtoIn = shape({ pageInfo: pageInfo() });
const getDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  name: string(),
  // File dorazí z multipart/form-data; `null` znamená "smazat logo".
  logo: any(),
});

export default {
  "club/list": {
    method: "get",
    validator: validate(listDtoIn),
    fn: ({ dtoIn }) => crud.list(dtoIn).then((itemList) => ({ itemList })),
  },

  "club/get": {
    method: "get",
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.get(dtoIn.id),
  },

  "club/create": {
    method: "post",
    auth: AUTH,
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  "club/update": {
    method: "post",
    auth: AUTH,
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  "club/delete": {
    method: "post",
    auth: AUTH,
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
