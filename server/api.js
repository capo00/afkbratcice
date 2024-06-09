const authenticationApi = require('./api/authentication-api');
const teamDao = require("./dao/team-dao");

const API = {
  ...authenticationApi,

  "team/list": {
    method: "get",
    fn: async ({ dtoIn }) => {
      // TODO cannot connect in deployed app :-( server google cannot connect to mongodb

      const itemList = await teamDao.list();

      // if (process.env.NODE_ENV !== "production") {
      //   // because of cors on localhost
      //   res.header("Access-Control-Allow-Origin", "*");
      //   res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
      //   res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      // }

      return { itemList };
    },
  },
}

module.exports = API;
