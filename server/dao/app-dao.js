const Dao = require("./dao");

class AppDao extends Dao {
  constructor() {
    super("app");
  }
}

module.exports = new AppDao();
