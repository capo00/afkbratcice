const Dao = require("../dao/dao");

class TurnamentDao extends Dao {
  constructor() {
    super("turnament");
  }

  createIndexes() {
    //super.createIndex({ name: 1 }, { unique: true });
  }
}

module.exports = new TurnamentDao();
