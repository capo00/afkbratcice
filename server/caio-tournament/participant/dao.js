const Dao = require("../../dao/dao");

class ParticipantDao extends Dao {
  constructor() {
    super("caioTournament_participant");
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { group: 1, seed: 1 });
  }
}

module.exports = new ParticipantDao();
