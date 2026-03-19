const Dao = require("../../dao/dao");

class HistoryLogDao extends Dao {
  constructor() {
    super("caioTournament_historyLog");
  }

  createIndexes() {
    this.createIndex({ tournamentId: 1 });
    this.createIndex({ entityType: 1, entityId: 1 });
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { ts: -1 });
  }
}

module.exports = new HistoryLogDao();
