const Dao = require("./dao");

class PlayerDao extends Dao {
  constructor() {
    super("player");
  }
}

module.exports = new PlayerDao();
