const Dao = require("../../dao/dao");

class CustomerDao extends Dao {
  constructor() {
    super("caioLenaVisage_customer");
  }

  createIndexes() {
    super.createIndex({ name: 1 });
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { name: 1 });
  }

  search(query) {
    if (!query) return this.list();
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return this.find({ name: regex }, { pageSize: 50 }, { name: 1 });
  }
}

module.exports = new CustomerDao();
