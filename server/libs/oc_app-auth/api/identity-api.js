const UuDataTypes = require("uu_datatypesg01");
const Identity = require("../abl/identity");

module.exports = {
  "identity/search": {
    method: "get",
    auth: true,
    validator: UuDataTypes.exact({
      query: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Identity.search(dtoIn.query);
      return { itemList };
    },
  },
};
