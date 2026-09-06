import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, array, integer, any, pageInfo }
  from "../services/validators.js";
import { roleAuth } from "../services/authorize.js";

const idDtoIn = shape({ id: mongoId().isRequired() });

// Sekce je objekt, ne holý string -- nadpis, kotva nebo varianta podkladu se pak přidají
// bez migrace (design/api.md, 2.8).
const section = shape({ content: string() });

const writeDtoIn = shape({
  id: mongoId(),
  name: string(),
  // Perex. Jmenuje se `desc` jako u `team`, `season` i obsahových stránek -- v celém
  // modelu je perex samostatné pole `desc`, ne první sekce a ne vlastní název.
  desc: string(),
  sectionList: array(section),
  author: string(),
  matchId: any(),
  priority: integer(),
  state: oneOf(Config.ARTICLE_STATE),
  publishTime: string(),
  tagList: array(string()),
  // File, nebo null = smazat titulní foto.
  photograph: any(),
});

export default {
  "article/list": {
    method: "get",
    validator: validate(shape({
      state: oneOf(Config.ARTICLE_STATE),
      matchId: mongoId(),
      tag: string(),
      pageInfo: pageInfo(),
    })),
    // Jediný list use case appky, který vrací `pageInfo` -- novinky se reálně stránkují
    // a klient bez `total` neví, jestli je co načítat dál.
    fn: ({ dtoIn, identity }) => crud.list(dtoIn, identity),
  },

  "article/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn, identity }) => crud.get(dtoIn.id, identity),
  },

  "article/create": {
    method: "post",
    auth: roleAuth(Config.NEWS),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => crud.create(dtoIn, identity),
  },

  "article/update": {
    method: "post",
    auth: roleAuth(Config.NEWS),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  "article/setState": {
    method: "post",
    auth: roleAuth(Config.NEWS),
    validator: validate(shape({
      id: mongoId().isRequired(),
      state: oneOf(Config.ARTICLE_STATE).isRequired(),
    })),
    fn: ({ dtoIn }) => crud.setState(dtoIn),
  },

  "article/delete": {
    method: "post",
    auth: roleAuth(Config.NEWS),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
