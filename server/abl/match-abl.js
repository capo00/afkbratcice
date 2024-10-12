const OcAppCore = require("../libs/oc_app-core");
const dao = require("../dao/match-dao");

module.exports = new OcAppCore.Crud("match", dao);
