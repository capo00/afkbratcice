const Dao = require("./dao");

class SeasonDao extends Dao {
  constructor() {
    super("season");
  }

  createIndexes() {
    super.createIndex({ competition: 1, yearFrom: 1 }, { unique: true });
    super.createIndex({ yearFrom: -1, teamList: 1 });
  }

  getCurrentByTeam(teamId) {
    const now = new Date();
    const yearFrom = now.getMonth() + 1 < 8 ? now.getFullYear() - 1 : now.getFullYear();
    return super.findOne({ yearFrom: yearFrom + "", teamList: teamId });
  }

  listByTeam(teamId) {
    return super.find({ teamList: teamId });
  }
}

module.exports = new SeasonDao();
