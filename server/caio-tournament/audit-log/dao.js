const Dao = require("../../dao/dao");

class AuditLogDao extends Dao {
  constructor() {
    super("caioTournament_auditLog");
  }

  createIndexes() {
    this.createIndex({ tournamentId: 1, entityType: 1, entityId: 1, action: 1, "sys.cts": -1 });
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { "sys.cts": -1 });
  }

  deleteByTournamentId(tournamentId) {
    return this.deleteByFilter({ tournamentId });
  }
}

module.exports = new AuditLogDao();
