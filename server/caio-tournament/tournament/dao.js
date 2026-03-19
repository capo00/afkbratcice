const Dao = require("../../dao/dao");

class TournamentDao extends Dao {
  constructor() {
    super("caioTournament_tournament");
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { "sys.cts": -1 });
  }
}

module.exports = new TournamentDao();
