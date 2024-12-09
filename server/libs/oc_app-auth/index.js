const Passport = require('./helpers/passport');
const Routes = require('./api/routes');
const authentication = require("./api/authentication");

module.exports = {
  init(app, { prefixPath = "/auth" } = {}) {
    Passport.init(prefixPath);
    app.use(prefixPath, Routes.init(prefixPath));
  },

  authentication,
}
