const path = require("path");
const AppServer = require("./libs/oc_app-server");
// const OcBinaryStorage = require("./libs/oc_binarystore");
const afkApi = require("./api");
const theChaseApi = require("./the-chase/api");

const API = {
  ...theChaseApi,
  ...afkApi,
};

const publicPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "../public") : path.resolve(__dirname, "../client/oc_afkbratcice_maing01-hi/public");

const app = AppServer.App.init({
  publicPath,
  api: API,
});
