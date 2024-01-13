const Dao = require("./dao");

class TeamDao extends Dao {
  constructor() {
    super("team");
  }
}

module.exports = new TeamDao();
