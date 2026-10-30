import { Authorization } from "caio-server";
import Config from "../config.js";
import crud from "./crud.js";
import { validate, shape, string, array, integer, any } from "../services/validators.js";

export default {
  "appConfig/get": {
    method: "get",
    validator: validate(shape({})),
    fn: () => crud.get(),
  },

  "appConfig/update": {
    method: "post",
    auth: Authorization.auth(Config.ADMIN),
    validator: validate(shape({
      id: any(),
      categoryOrder: array(string()),
      hideNamesAgeList: array(string()),
      notice: string(),
      contact: any(),
      socialList: any(),
      fileCategoryList: any(),
      founded: integer(),
    })),
    fn: ({ dtoIn }) => crud.update(dtoIn),
  },
};
