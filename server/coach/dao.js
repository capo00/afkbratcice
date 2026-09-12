import { Dao } from "caio-server";

class CoachDao extends Dao {
  constructor() {
    super("afk_coach");
  }

  createIndexes() {
    return Promise.all([
      super.createIndex({ personId: 1, role: 1 }, { unique: true }),
      super.createIndex({ "teamList.id": 1 }),
      super.createIndex({ role: 1 }),
    ]);
  }

  listByFilter({ teamId, role, active, idList } = {}, pageInfo) {
    if (idList) return this.listByIdList(idList);

    const filter = {};
    if (role) filter.role = role;
    if (teamId) {
      const membership = { id: teamId };
      if (active) {
        const today = new Date().toISOString().slice(0, 10);
        membership.$or = [{ dateTo: null }, { dateTo: { $exists: false } }, { dateTo: { $gte: today } }];
      }
      filter.teamList = { $elemMatch: membership };
    }
    return this.find(filter, pageInfo, { role: 1 });
  }
}

export default new CoachDao();
