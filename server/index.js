const path = require("path");
const AppServer = require("./libs/oc_app-server");
// const OcBinaryStorage = require("./libs/oc_binarystore");
const afkApi = require("./api");
const theChaseApi = require("./the-chase/api");
const caioTournamentApi = require("./caio-tournament/api");
const identityApi = require("./libs/oc_app-auth/api/identity-api");

const API = {
  ...theChaseApi,
  ...afkApi,
  ...caioTournamentApi,
  ...identityApi,
};

const publicPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "../public") : path.resolve(__dirname, "../client/oc_afkbratcice_maing01-hi/public");

const app = AppServer.App.init({
  publicPath,
  api: API,
});
