const UuDataTypes = require("uu_datatypesg01");
const Identity = require("../abl/identity");

module.exports = {
  "identity/search": {
    method: "get",
    auth: true,
    validator: UuDataTypes.exact({
      query: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      const itemList = await Identity.search(dtoIn.query, identity);
      return { itemList };
    },
  },

  "identity/list": {
    method: "get",
    auth: true,
    validator: UuDataTypes.exact({
      idList: UuDataTypes.arrayOf(UuDataTypes.string),
      identityList: UuDataTypes.arrayOf(UuDataTypes.string),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Identity.list(dtoIn);
      return { itemList };
    },
  },

  "identity/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      identity: UuDataTypes.string,
    }),
    fn: ({ dtoIn, identity }) => {
      return Identity.get(dtoIn, identity);
    },
  },
};
