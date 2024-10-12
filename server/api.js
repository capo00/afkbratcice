const binaryApi = require("./api/binary-api");
const teamApi = require("./api/team-api");
const seasonApi = require("./api/season-api");

const API = {
  ...binaryApi,
  ...teamApi,
  ...seasonApi,
}

module.exports = API;
