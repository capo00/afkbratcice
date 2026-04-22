const Dao = require("../../dao/dao");

class ProductDao extends Dao {
  constructor() {
    super("caioLenaVisage_product");
  }

  createIndexes() {
    super.createIndex({ type: 1 }, { unique: true });
  }

  list() {
    return this.find({}, undefined, { type: 1 });
  }

  getByType(type) {
    return this.findOne({ type });
  }
}

module.exports = new ProductDao();
