const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");

module.exports = {
  "caio-tournament/auditLog/list": {
    method: "get",
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn.tournamentId, dtoIn);
      return { itemList };
    },
  },
};
