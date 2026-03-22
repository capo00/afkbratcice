const Dao = require("../../dao/dao");

class TournamentDao extends Dao {
  constructor() {
    super("caioTournament_tournament");
  }

  createIndexes() {
    super.createIndex({ tournamentId: 1 });
    super.createIndex({ tournamentId: 1, group: 1 });
    super.createIndex({ state: 1 });
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo);
  }
}

module.exports = new TournamentDao();
