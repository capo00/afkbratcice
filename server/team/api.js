import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, array, boolean, any, pageInfo, truthy } from "../services/validators.js";
import { teamScoped, roleAuth, hasRole } from "../services/authorize.js";

const listDtoIn = shape({
  // Věková skupina (všechny kategorie, které do ní patří), nebo jedna konkrétní kategorie.
  age: oneOf(Config.AGE_LIST),
  category: string(),
  own: any(),
  idList: array(mongoId()),
  pageInfo: pageInfo(),
});

const getDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  name: string(),
  shortName: string(),
  // Kód kategorie (`afk_category.code`), např. men-a, u15-b.
  category: string(),
  own: boolean(),
  clubId: mongoId(),
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

  // Editor týmu smí upravit svůj tým (název, zkratku, klub). Logo je od 2026-09-11 věcí
  // `club/update` (jen CONTENT) -- TE ho spravovat nemá, viz design/roles.md, 5.2.
  "team/update": {
    method: "post",
    auth: teamScoped(async (dtoIn) => [dtoIn?.id], Config.CONTENT, "all"),
    validator: validate(writeDtoIn),
    // Kategorii mění jen CONTENT: editor týmu by přepnutím na starou gardu obešel pravidlo,
    // kdo proti komu smí hrát (services/category.js).
    fn: ({ dtoIn, identity }) => {
      if (hasRole(identity, Config.CONTENT)) return crud.update(dtoIn);
      const { category, ...rest } = dtoIn;
      return crud.update(rest);
    },
  },

  "team/delete": {
    method: "post",
    auth: roleAuth(Config.CONTENT),
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
