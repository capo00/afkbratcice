import { Dao } from "caio-server";
import { ObjectId } from "mongodb";

class SeasonDao extends Dao {
  constructor() {
    super("season");
  }

  createIndexes() {
    return Promise.all([
      super.createIndex({ competition: 1, yearFrom: 1, age: 1 }, { unique: true }),
      super.createIndex({ age: 1, yearFrom: -1 }),
      super.createIndex({ teamList: 1 }),
      super.createIndex({ yearFrom: -1 }),
    ]);
  }

  listByFilter({ age, teamId, yearFrom, idList } = {}, pageInfo) {
    const filter = {};
    if (age) filter.age = age;
    if (yearFrom) filter.yearFrom = yearFrom;
    if (teamId) filter.teamList = teamId;
    // `idList` je pro dopojmenování sezón, na které odkazuje něco jiného: `stats/getPlayerStats`
    // vrací `bySeasonList` jen se `seasonId`, takže bez tohohle by profil hráče musel načíst
    // všechny sezóny klubu kvůli pěti řádkům. `Dao.find` `_id` z `id` nepřeloží u `$in`,
    // proto ObjectId ručně.
    if (idList?.length) filter._id = { $in: idList.map((id) => new ObjectId(id)) };
    return this.find(filter, pageInfo, { yearFrom: -1, age: 1 });
  }

  /** Sezóny daného ročníku, ve kterých hraje některý z uvedených týmů. */
  listByYearAndTeams(yearFrom, teamIdList) {
    return this.find({ yearFrom, teamList: { $in: teamIdList } }, undefined, { age: 1 });
  }

  findCurrentByTeam(yearFrom, teamId) {
    return this.findOne({ yearFrom, teamList: teamId });
  }

  findCurrentByAge(yearFrom, age) {
    return this.findOne({ yearFrom, age });
  }

  async listYears() {
    const itemList = await this.find({}, { pageSize: 1000 }, { yearFrom: -1 }, { yearFrom: 1 });
    return [...new Set(itemList.map((item) => item.yearFrom))];
  }
}

export default new SeasonDao();
