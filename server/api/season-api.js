const UuDataTypes = require("uu_datatypesg01");
const Abl = require("../abl/season-abl");
const MatchAbl = require("../abl/match-abl");

module.exports = {
  "season/list": {
    method: "get",
    validator: UuDataTypes.exact({
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
  "season/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },
  "season/create": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   age: UuDataTypes.oneOf(["men"]),
    //   competition: UuDataTypes.oneOf(["III. třída"]),
    //   yearFrom: UuDataTypes.number,
    //   desc: UuDataTypes.string,
    //   teamList: UuDataTypes.arrayOf(UuDataTypes.string),
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },
  "season/update": {
    method: "post",
    auth: ["operatives"],
    // TODO add file or shape/object to UuDataTypes
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   age: UuDataTypes.oneOf(["men"]),
    //   competition: UuDataTypes.oneOf(["III. třída"]),
    //   yearFrom: UuDataTypes.number,
    //   desc: UuDataTypes.string,
    //   teamList: UuDataTypes.array,
    // }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await Abl.update(dtoIn);
    },
  },
  "season/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.delete(dtoIn.id);
    },
  },
  "season/getTable": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      teamId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await MatchAbl.getTable({ seasonId: dtoIn.id, teamId: dtoIn.teamId });
    },
  },
}
