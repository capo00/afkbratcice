const teamApi = require("./api/team-api");
const binaryApi = require("./api/binary-api");

const API = {
  ...teamApi,
  ...binaryApi,
}

module.exports = API;
