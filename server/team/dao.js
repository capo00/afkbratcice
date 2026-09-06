import { Dao } from "caio-server";

class TeamDao extends Dao {
  constructor() {
    super("team");
  }

  createIndexes() {
    return Promise.all([
      // Stejný klub ve dvou kategoriích jsou dva dokumenty, proto je age v klíči.
      super.createIndex({ name: 1, age: 1 }, { unique: true }),
      super.createIndex({ age: 1, name: 1 }),
      super.createIndex({ own: 1 }),
    ]);
  }

  listByFilter({ age, own, idList } = {}, pageInfo) {
    const filter = {};
    if (age) filter.age = age;
    if (own !== undefined) filter.own = own;
    if (idList) return this.listByIdList(idList);
    return this.find(filter, pageInfo, { name: 1 });
  }

  listOwn() {
    return this.find({ own: true }, undefined, { name: 1 });
  }
}

export default new TeamDao();
