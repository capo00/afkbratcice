const UuDataTypes = require("uu_datatypesg01");
const TeamAbl = require("../abl/team-abl");

module.exports = {
  "team/list": {
    method: "get",
    validator: UuDataTypes.exact({
      pageInfo: UuDataTypes.exact({
        pageSize: UuDataTypes.number,
        pageIndex: UuDataTypes.number
      }),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await TeamAbl.list(dtoIn?.pageInfo);
      return { itemList };
    },
  },
  "team/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await TeamAbl.get(dtoIn.id);
    },
  },
  "team/create": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   name: UuDataTypes.string,
    //   logoUri: UuDataTypes.exact({}),
    //   age: UuDataTypes.oneOf(["adults"]),
    // }),
    fn: async ({ dtoIn }) => {
      return await TeamAbl.create(dtoIn);
    },
  },
  "team/update": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   name: UuDataTypes.string,
    //   logoUri: UuDataTypes.string,
    //   age: UuDataTypes.oneOf(["adults"]),
    // }),
    fn: async ({ dtoIn }) => {
      return await TeamAbl.update(dtoIn);
    },
  },
  "team/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await TeamAbl.delete(dtoIn.id);
    },
  },
}
