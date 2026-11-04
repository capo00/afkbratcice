import { Dao } from "caio-server";

// Karta hráče: `{ personId, position, note }`. Členství v týmech je soupiska (`roster/dao.js`).

class PlayerDao extends Dao {
  constructor() {
    super("afk_player");
  }

  createIndexes() {
    return super.createIndex({ personId: 1 }, { unique: true });
  }

  findByPersonId(personId) {
    return this.findOne({ personId });
  }
}

export default new PlayerDao();
