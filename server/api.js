const binaryApi = require("./api/binary-api");
const teamApi = require("./api/team-api");
const seasonApi = require("./api/season-api");
const matchApi = require("./api/match-api");
const uveApi = require("./api/uve-api");
const appApi = require("./api/app-api");

const API = {
  ...binaryApi,
  ...teamApi,
  ...seasonApi,
  ...matchApi,
  ...uveApi,
  ...appApi,
}

module.exports = API;
