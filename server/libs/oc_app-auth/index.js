const Passport = require('./helpers/passport');
const routes = require('./api/routes');
const authentication = require("./api/authentication");

module.exports = {
  init(app, { prefixPath = "/auth" } = {}) {
    Passport.init(prefixPath);

    app.use(prefixPath, routes)
  },

  authentication,
}