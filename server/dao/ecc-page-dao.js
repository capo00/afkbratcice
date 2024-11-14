const Dao = require("./dao");

class EccPageDao extends Dao {
  constructor() {
    super("ecc_page");
  }

  createIndexes() {
    super.createIndex({ seasonList: 1 });
  }
}

module.exports = new EccPageDao();
