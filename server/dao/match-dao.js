const Dao = require("./dao");

class MatchDao extends Dao {
  constructor() {
    super("match");
  }

  createIndexes() {
    super.createIndex({ seasonId: 1, homeTeamId: 1, guestTeamId: 1 }, { unique: true });
    super.createIndex({ time: 1 });
  }
}

module.exports = new MatchDao();
