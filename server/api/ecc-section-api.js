const UuDataTypes = require("uu_datatypesg01");
const Abl = require("../abl/ecc-section-abl");

module.exports = {
  "eccSection/list": {
    method: "get",
    validator: UuDataTypes.exact({
      idList: UuDataTypes.arrayOf(UuDataTypes.string),
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
  "eccSection/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },
  "eccSection/update": {
    method: "post",
    auth: ["operatives"],
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   data: UuDataTypes.object,
    // }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await Abl.update(dtoIn);
    },
  },
  "eccSection/lock": {
    method: "post",
    auth: ["operatives", "writers"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.lock(dtoIn, identity);
    },
  },
  "eccSection/unlock": {
    method: "post",
    auth: ["operatives", "writers"],
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   uu5String: UuDataTypes.oneOfType([UuDataTypes.object, UuDataTypes.string]),
    // }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.unlock(dtoIn, identity);
    },
  },
}
