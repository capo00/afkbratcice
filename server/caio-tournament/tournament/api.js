const path = require("path");
const UuDataTypes = require("uu_datatypesg01");
const Abl = require("./abl");

module.exports = {
  "caio-tournament": {
    method: "get",
    fn: async ({ res, publicPath }) => {
      res.sendFile(path.resolve(publicPath, "caio-tournament.html"));
      return false;
    },
  },
  "caio-tournament/tournament": {
    method: "get",
    fn: async ({ res, publicPath }) => {
      res.sendFile(path.resolve(publicPath, "caio-tournament.html"));
      return false;
    },
  },

  "caio-tournament/tournament/list": {
    method: "get",
    validator: UuDataTypes.exact({
      state: UuDataTypes.string,
      excludeState: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn);
      return { itemList };
    },
  },

  "caio-tournament/tournament/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },

  "caio-tournament/tournament/create": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      type: UuDataTypes.string,
      name: UuDataTypes.string,
      date: UuDataTypes.string,
      place: UuDataTypes.string,
      desc: UuDataTypes.string,
      groupCount: UuDataTypes.number,
      advanceFromGroup: UuDataTypes.number,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.create(dtoIn, identity);
    },
  },

  "caio-tournament/tournament/update": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
      name: UuDataTypes.string,
      type: UuDataTypes.string,
      date: UuDataTypes.string,
      place: UuDataTypes.string,
      desc: UuDataTypes.string,
      groupCount: UuDataTypes.number,
      advanceFromGroup: UuDataTypes.number,
      operativeList: UuDataTypes.arrayOf(UuDataTypes.string),
      refereeList: UuDataTypes.arrayOf(UuDataTypes.string),
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.update(dtoIn, identity);
    },
  },

  "caio-tournament/tournament/delete": {
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

  "caio-tournament/tournament/close": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      return await Abl.close(dtoIn.tournamentId, identity);
    },
  },

  "caio-tournament/tournament/generateMatches": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      const itemList = await Abl.generateMatches(dtoIn.tournamentId, identity);
      return { itemList };
    },
  },

  "caio-tournament/tournament/generatePlayoff": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      const itemList = await Abl.generatePlayoff(dtoIn.tournamentId, identity);
      return { itemList };
    },
  },

  "caio-tournament/tournament/evaluate": {
    method: "post",
    auth: true,
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn, identity }) => {
      const itemList = await Abl.evaluate(dtoIn.tournamentId, identity);
      return { itemList };
    },
  },

  "caio-tournament/tournament/finalStandings": {
    method: "get",
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.getFinalStandings(dtoIn.tournamentId);
      return { itemList };
    },
  },

  "caio-tournament/tournament/listStandings": {
    method: "get",
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
      group: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.listStandings(dtoIn.tournamentId, dtoIn.group);
      return { itemList };
    },
  },

  "caio-tournament/tournament/playoff": {
    method: "get",
    validator: UuDataTypes.exact({
      tournamentId: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.playoff(dtoIn.tournamentId);
      return { itemList };
    },
  },
};
