const Dao = require("./dao");

class TeamDao extends Dao {
  constructor() {
    super("team");
  }

  createIndexes() {
    super.createIndex({ name: 1, age: 1 }, { unique: true });
  }
}

module.exports = new TeamDao();
