import { Dao } from "caio-server";

class CategoryDao extends Dao {
  constructor() {
    super("afk_category");
  }

  createIndexes() {
    return Promise.all([super.createIndex({ code: 1 }, { unique: true }), super.createIndex({ age: 1 })]);
  }

  findByCode(code) {
    return this.findOne({ code });
  }

  listByCodeList(codeList) {
    return this.find({ code: { $in: codeList } });
  }

  listByAge(age) {
    return this.find({ age });
  }
}

export default new CategoryDao();
