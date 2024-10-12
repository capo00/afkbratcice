const Dao = require("./dao");

class MatchDao extends Dao {
  constructor() {
    super("match");
  }

  createIndexes() {
    super.createIndex({ seasonId: 1, teamHomeId: 1, teamGuestId: 1 }, { unique: true });
    super.createIndex({ time: 1 });
  }
}

module.exports = new MatchDao();
