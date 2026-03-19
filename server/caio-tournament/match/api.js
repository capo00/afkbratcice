const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");

module.exports = {
  "caio-tournament/match/list": {
    method: "get",
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
      phase: UuDataTypes.string,
      group: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn.tournamentId, dtoIn);
      return { itemList };
    },
  },

  "caio-tournament/match/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },

  "caio-tournament/match/setResult": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      home: UuDataTypes.number,
      away: UuDataTypes.number,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.setResult(dtoIn.id, dtoIn, identity);
    },
  },
};
