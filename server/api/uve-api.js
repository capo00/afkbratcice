const UuDataTypes = require("uu_datatypesg01");
const Abl = require("../abl/uve-abl");

module.exports = {
  "uve/get": {
    method: "get",
    validator: UuDataTypes.exact({
      uri: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.uri);
    },
  },
}
