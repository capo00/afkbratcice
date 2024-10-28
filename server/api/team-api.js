const UuDataTypes = require("uu_datatypesg01");
const Abl = require("../abl/team-abl");

module.exports = {
  "team/list": {
    method: "get",
    validator: UuDataTypes.exact({
      age: UuDataTypes.string,
      pageInfo: UuDataTypes.exact({
        pageSize: UuDataTypes.number,
        pageIndex: UuDataTypes.number
      }),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn);
      return { itemList };
    },
  },
  "team/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },
  "team/create": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   name: UuDataTypes.string,
    //   logo: UuDataTypes.file,
    //   age: UuDataTypes.oneOf(["men"]),
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },
  "team/update": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   name: UuDataTypes.string,
    //   logo: UuDataTypes.file,
    //   age: UuDataTypes.oneOf(["men"]),
    // }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await Abl.update(dtoIn);
    },
  },
  "team/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.delete(dtoIn.id);
    },
  },
}
