const Dao = require("./dao");

class SeasonDao extends Dao {
  constructor() {
    super("season");
  }

  createIndexes() {
    super.createIndex({ competition: 1, yearFrom: 1 }, { unique: true });
  }
}

module.exports = new SeasonDao();
