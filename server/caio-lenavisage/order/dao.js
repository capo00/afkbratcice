const Dao = require("../../dao/dao");

class OrderDao extends Dao {
  constructor() {
    super("caioLenaVisage_order");
  }

  createIndexes() {
    super.createIndex({ product: 1, "wedding.time": -1 });
    super.createIndex({ customerId: 1 });
    super.createIndex({ paydate: 1 });
    super.createIndex({ "sys.cts": -1 });
  }

  list(filter = {}, pageInfo) {
    return this.find(filter, pageInfo, { "sys.cts": -1 });
  }
}

module.exports = new OrderDao();
