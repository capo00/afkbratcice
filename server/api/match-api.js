const UuDataTypes = require("uu_datatypesg01");
const Abl = require("../abl/match-abl");

module.exports = {
  "match/list": {
    method: "get",
    validator: UuDataTypes.exact({
      pageInfo: UuDataTypes.exact({
        pageSize: UuDataTypes.number,
        pageIndex: UuDataTypes.number
      }),
    }),
    fn: async ({ dtoIn }) => {
      const itemList = await Abl.list(dtoIn?.pageInfo);
      return { itemList };
    },
  },
  "match/get": {
    method: "get",
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.get(dtoIn.id);
    },
  },
  "match/create": {
    method: "post",
    auth: ["operatives"],
    // validator: UuDataTypes.exact({
    //   homeTeamId: UuDataTypes.string,
    //   guestTeamId: UuDataTypes.string,
    //   seasonId: UuDataTypes.string,
    //   playerList: UuDataTypes.array,
    //   round: UuDataTypes.string,
    //   time: UuDataTypes.string,
    //   place: UuDataTypes.string,
    //   departureTime: UuDataTypes.string,
    //   homeGoals: UuDataTypes.number,
    //   guestGoals: UuDataTypes.number,
    //   homeGoalsHalf: UuDataTypes.number,
    //   guestGoalsHalf: UuDataTypes.number,
    //   penalty: UuDataTypes.bool,
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.create(dtoIn);
    },
  },
  "match/createMany": {
    method: "post",
    auth: ["operatives"],
    // validator: UuDataTypes.exact({
    //   itemList: UuDataTypes.arrayOf(UuDataTypes.exact({
    //     seasonId: UuDataTypes.string,
    //     homeTeamId: UuDataTypes.string,
    //     guestTeamId: UuDataTypes.string,
    //     round: UuDataTypes.string,
    //     time: UuDataTypes.string,
    //     homeGoals: UuDataTypes.number,
    //     guestGoals: UuDataTypes.number,
    //     homeGoalsHalf: UuDataTypes.number,
    //     guestGoalsHalf: UuDataTypes.number,
    //   })),
    // }),
    fn: async ({ dtoIn }) => {
      return await Abl.createMany(dtoIn.itemList);
    },
  },
  "match/update": {
    method: "post",
    auth: ["operatives"],
    // validator: UuDataTypes.exact({
    //   id: UuDataTypes.string,
    //   homeTeamId: UuDataTypes.string,
    //   guestTeamId: UuDataTypes.string,
    //   seasonId: UuDataTypes.string,
    //   playerList: UuDataTypes.array,
    //   round: UuDataTypes.string,
    //   time: UuDataTypes.string,
    //   place: UuDataTypes.string,
    //   departureTime: UuDataTypes.string,
    //   homeGoals: UuDataTypes.number,
    //   guestGoals: UuDataTypes.number,
    //   homeGoalsHalf: UuDataTypes.number,
    //   guestGoalsHalf: UuDataTypes.number,
    //   penalty: UuDataTypes.bool,
    // }),
    fn: async ({ dtoIn }) => {
      delete dtoIn.sys;
      return await Abl.update(dtoIn);
    },
  },
  "match/delete": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      id: UuDataTypes.string,
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.delete(dtoIn.id);
    },
  },
  "match/deleteMany": {
    method: "post",
    auth: ["operatives"],
    validator: UuDataTypes.exact({
      idList: UuDataTypes.arrayOf(UuDataTypes.string),
    }),
    fn: async ({ dtoIn }) => {
      return await Abl.deleteMany(dtoIn.idList);
    },
  },
}
