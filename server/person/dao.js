import { Dao } from "caio-server";

class PersonDao extends Dao {
  constructor() {
    super("person");
  }

  createIndexes() {
    return Promise.all([
      super.createIndex({ surname: 1, name: 1 }),
      super.createIndex({ email: 1 }, { sparse: true }),
      super.createIndex({ identity: 1 }, { unique: true, sparse: true }),
    ]);
  }

  listByFilter({ query, idList } = {}, pageInfo) {
    if (idList) return this.listByIdList(idList);
    const filter = {};
    if (query) {
      // Dao neumí fulltext; regex nad příjmením a jménem stačí na pár set osob.
      const escaped = String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ surname: regex }, { name: regex }];
    }
    return this.find(filter, pageInfo, { surname: 1, name: 1 });
  }

  findByIdentity(identity) {
    return this.findOne({ identity });
  }
}

export default new PersonDao();
