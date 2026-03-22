const Dao = require("../../dao/dao");

class ParticipantDao extends Dao {
  constructor() {
    super("caioTournament_participant");
  }

  createIndexes() {
    super.createIndex({ tournamentId: 1 });
    super.createIndex({ tournamentId: 1, group: 1 });
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { group: 1, seed: 1 });
  }

  deleteByTournamentId(tournamentId) {
    return this.deleteByFilter({ tournamentId });
  }
}

module.exports = new ParticipantDao();
