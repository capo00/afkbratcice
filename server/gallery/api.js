import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, mongoId, oneOf, any, pageInfo } from "../services/validators.js";
import { roleAuth } from "../services/authorize.js";

const idDtoIn = shape({ id: mongoId().isRequired() });

const writeDtoIn = shape({
  id: mongoId(),
  name: string(),
  date: string(),
  author: string(),
  seasonId: mongoId(),
  matchId: mongoId(),
  category: oneOf(Config.GALLERY_CATEGORY),
  coverBinaryId: mongoId(),
  state: oneOf(Config.GALLERY_STATE),
});

export default {
  "gallery/list": {
    method: "get",
    validator: validate(shape({
      state: oneOf(Config.GALLERY_STATE),
      seasonId: mongoId(),
      matchId: mongoId(),
      category: oneOf(Config.GALLERY_CATEGORY),
      pageInfo: pageInfo(),
    })),
    fn: ({ dtoIn, identity }) => crud.list(dtoIn, identity).then((itemList) => ({ itemList })),
  },

  "gallery/get": {
    method: "get",
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.get(dtoIn.id),
  },

  "gallery/listPhotos": {
    method: "get",
    validator: validate(shape({ id: mongoId().isRequired(), pageInfo: pageInfo() })),
    fn: ({ dtoIn }) => crud.listPhotos(dtoIn).then((itemList) => ({ itemList })),
  },

  "gallery/create": {
    method: "post",
    auth: roleAuth(Config.GALLERY),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.create({ photoCount: 0, state: "draft", ...dtoIn }),
  },

  "gallery/update": {
    method: "post",
    auth: roleAuth(Config.GALLERY),
    validator: validate(writeDtoIn),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },

  // Dva soubory: plná verze a náhled. GCS náhledy negeneruje.
  "gallery/addPhoto": {
    method: "post",
    auth: roleAuth(Config.GALLERY),
    validator: validate(shape({ id: mongoId().isRequired(), file: any(), thumb: any(), name: string() })),
    fn: ({ dtoIn }) => crud.addPhoto(dtoIn),
  },

  "gallery/deletePhoto": {
    method: "post",
    auth: roleAuth(Config.GALLERY),
    validator: validate(shape({ id: mongoId().isRequired(), binaryId: mongoId().isRequired() })),
    fn: ({ dtoIn }) => crud.deletePhoto(dtoIn),
  },

  "gallery/delete": {
    method: "post",
    auth: roleAuth(Config.GALLERY),
    validator: validate(idDtoIn),
    fn: ({ dtoIn }) => crud.delete(dtoIn.id).then(() => ({})),
  },
};
