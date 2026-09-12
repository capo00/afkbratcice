import { Dao } from "caio-server";

class PlayerDao extends Dao {
  constructor() {
    super("afk_player");
  }

  createIndexes() {
    return Promise.all([
      super.createIndex({ personId: 1 }, { unique: true }),
      super.createIndex({ "teamList.id": 1 }),
    ]);
  }

  /**
   * @param active true = jen otevřená členství (dateTo prázdné nebo v budoucnu)
   */
  listByFilter({ teamId, active, idList } = {}, pageInfo) {
    if (idList) return this.listByIdList(idList);

    const filter = {};
    if (teamId) {
      const membership = { id: teamId };
      if (active) {
        const today = new Date().toISOString().slice(0, 10);
        membership.$or = [{ dateTo: null }, { dateTo: { $exists: false } }, { dateTo: { $gte: today } }];
      }
      filter.teamList = { $elemMatch: membership };
    }
    return this.find(filter, pageInfo, { number: 1 });
  }

  findByPersonId(personId) {
    return this.findOne({ personId });
  }
}

export default new PlayerDao();
