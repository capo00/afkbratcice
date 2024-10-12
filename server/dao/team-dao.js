const Dao = require("./dao");

class TeamDao extends Dao {
  constructor() {
    super("team");
  }

  createIndexes() {
    super.createIndex({ name: 1, age: 1 }, { unique: true });
  }

  listByAge(age) {
    return super.find({ age }, undefined, { name: 1 });
  }
}

module.exports = new TeamDao();
