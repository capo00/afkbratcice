const Dao = require("./dao");

class MatchDao extends Dao {
  constructor() {
    super("match");
  }

  createIndexes() {
    super.createIndex({ seasonId: 1, homeTeamId: 1, guestTeamId: 1 }, { unique: true });
    super.createIndex({ time: 1 });
    super.createIndex({ homeTeamId: 1, guestTeamId: 1, time: 1, homeGoals: 1 });
  }

  listBySeason(seasonId) {
    return super.find({ seasonId });
  }

  getLastMatch(teamId) {
    return this.findOne({
      $or: [{ homeTeamId: teamId }, { guestTeamId: teamId }],
      homeGoals: { $exists: true },
      time: { $lt: new Date().toISOString() }, // Ensures the time is in the past
    }, undefined, { time: -1 });
  }

  getNextMatch(teamId) {
    return this.findOne({
      $or: [{ homeTeamId: teamId }, { guestTeamId: teamId }],
      homeGoals: { $exists: false },
      time: { $exists: true },
    }, undefined, { time: 1 });
  }
}

module.exports = new MatchDao();
