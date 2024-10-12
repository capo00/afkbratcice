const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/season-dao");

module.exports = new OcAppCore.Crud("season", dao);
