const Dao = require("./dao");

class IdentityDao extends Dao {
  constructor() {
    super("sys_identity");
  }

  createIndexes() {
    super.createIndex({ identity: 1 }, { unique: true });
    super.createIndex({ email: 1, password: 1 }, { unique: true });
    super.createIndex({ name: 1 });
  }
}

module.exports = new IdentityDao();
