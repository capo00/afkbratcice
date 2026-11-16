import { Authorization } from "caio-server";
import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, array, boolean, any, pageInfo, truthy } from "../services/validators.js";

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

// Co smí editor týmu změnit na svém týmu (review 2026-11-12, S3). Výčet, ne seznam zákazů,
// aby nové pole týmu nebylo automaticky jeho:
//  - `category`: přepnutím na starou gardu by obešel pravidlo, kdo proti komu smí hrát
//    (services/category.js);
//  - `own`: z něj se staví menu, úvod, přehled mužstev i sitemap -- `own: false` celou
//    kategorii schová z webu a tým se začne chovat jako soupeř;
//  - `clubId`: přepíše erb týmu za erb jiného klubu (`team/crud.js`); týmy zakládá CONTENT
//    i s klubem a trenér ho měnit nepotřebuje.
const TEAM_EDITOR_FIELD_LIST = ["id", "name", "shortName"];

function pick(object, keyList) {
  return Object.fromEntries(keyList.filter((key) => object[key] !== undefined).map((key) => [key, object[key]]));
}

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
    auth: Authorization.auth(Config.CONTENT),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create(dtoIn),
  },

  // Editor týmu smí u svého týmu jen název a zkratku (`TEAM_EDITOR_FIELD_LIST`). Logo je od
  // 2026-09-11 věcí `club/update` (jen CONTENT) -- TE ho spravovat nemá, viz design/roles.md, 5.2.
  "team/update": {
    method: "post",
    auth: Authorization.auth(Config.CONTENT, {
      role: Config.ROLE.TEAM_EDITOR,
      resolve: ({ dtoIn }) => [dtoIn?.id],
      mode: "all",
    }),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn, identity }) => {
      if (Authorization.hasProfile(identity, Config.CONTENT)) return crud.update(dtoIn);
      return crud.update(pick(dtoIn, TEAM_EDITOR_FIELD_LIST));
    },
  },

  "team/delete": {
    method: "post",
    auth: Authorization.auth(Config.CONTENT),
    validator: validate(getDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
