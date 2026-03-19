const Dao = require("../../dao/dao");

class MatchDao extends Dao {
  constructor() {
    super("caioTournament_match");
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { phase: 1, round: 1 });
  }
}

module.exports = new MatchDao();
