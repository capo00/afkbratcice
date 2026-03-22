const Dao = require("../../dao/dao");

class MatchDao extends Dao {
  constructor() {
    super("caioTournament_match");
  }

  createIndexes() {
    super.createIndex({ tournamentId: 1 });
    super.createIndex({ tournamentId: 1, phase: 1, group: 1, round: 1 });
  }

  list(tournamentId, pageInfo) {
    if (tournamentId && typeof tournamentId === "object") throw new Error("tournamentId must be a string");
    return this.find({ tournamentId }, pageInfo);
  }

  listGroup(tournamentId, group, pageInfo) {
    const filter = { tournamentId, phase: "group" };
    if (group) filter.group = group;
    return this.find(filter, pageInfo, { round: 1 });
  }

  listPlayoff(tournamentId, group, pageInfo) {
    const filter = { tournamentId, phase: "playoff" };
    if (group) filter.group = group;
    return this.find(filter, pageInfo, { round: 1 });
  }

  deleteByTournamentId(tournamentId) {
    return this.deleteByFilter({ tournamentId });
  }
}

module.exports = new MatchDao();
