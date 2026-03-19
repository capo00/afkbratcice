const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");

module.exports = {
  "caio-tournament/participant/list": {
    method: "get",
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn.tournamentId, dtoIn);
      return { itemList };
    },
  },

  "caio-tournament/participant/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },

  "caio-tournament/participant/create": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
      name: UuDataTypes.string,
      group: UuDataTypes.string,
      seed: UuDataTypes.number,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.create(dtoIn.tournamentId, dtoIn, identity);
    },
  },

  "caio-tournament/participant/update": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      name: UuDataTypes.string,
      desc: UuDataTypes.string,
      group: UuDataTypes.string,
      seed: UuDataTypes.number,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.update(dtoIn, identity);
    },
  },

  "caio-tournament/participant/delete": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      await Abl.delete(dtoIn.id, identity);
      return {};
    },
  },
};
