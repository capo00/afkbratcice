import { Dao } from "caio-server";
import { membershipCondition } from "../services/membership.js";

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
   * @param active true = jen členství, která trvají dnes
   * @param range  `{ from, to }` = jen členství zasahující do období (soupiska sezóny)
   */
  listByFilter({ teamId, active, range, idList } = {}, pageInfo) {
    if (idList) return this.listByIdList(idList);

    const filter = {};
    if (teamId) filter.teamList = { $elemMatch: membershipCondition({ id: teamId }, { active, range }) };
    return this.find(filter, pageInfo, { number: 1 });
  }

  findByPersonId(personId) {
    return this.findOne({ personId });
  }
}

export default new PlayerDao();
