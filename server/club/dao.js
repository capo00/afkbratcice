import { Dao } from "caio-server";

class ClubDao extends Dao {
  constructor() {
    super("afk_club");
  }

  createIndexes() {
    return Promise.all([super.createIndex({ name: 1 }, { unique: true })]);
  }
}

export default new ClubDao();
