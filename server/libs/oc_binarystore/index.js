const routes = require("./api/routes");
const Config = require("./config/config");
const Abl = require("./abl");

module.exports = {
  init(app, { googleDiskAuthPath, prefixPath = "/binary" } = {}) {
    Config.googleDiskAuthPath = googleDiskAuthPath;
  },
  Abl,
}
