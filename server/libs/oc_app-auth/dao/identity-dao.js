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

  async search(query) {
    if (!query) return [];
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return this.find({ $or: [{ name: regex }, { identity: regex }] }, { pageSize: 20 });
  }
}

module.exports = new IdentityDao();
