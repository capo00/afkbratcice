import { Dao } from "caio-server";

class TeamDao extends Dao {
  constructor() {
    super("afk_team");
  }

  createIndexes() {
    return Promise.all([
      // Stejný klub ve dvou kategoriích jsou dva dokumenty, proto je age v klíči.
      super.createIndex({ name: 1, age: 1 }, { unique: true }),
      super.createIndex({ age: 1, name: 1 }),
      super.createIndex({ own: 1 }),
      super.createIndex({ clubId: 1 }),
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

  listByClub(clubId) {
    return this.find({ clubId });
  }

  /**
   * Erb je od klubu odvozený, ale `team.logoUri` zůstává denormalizace (čtení bez joinu,
   * stejně jako dřív) -- takže při změně loga na klubu se musí přepsat na všech
   * kategoriích, ne jen na tom týmu, který logo zrovna edituje (design/data-model.md, 1.2).
   */
  async updateLogoUriByClub(clubId, logoUri) {
    await this._exec(() =>
      this.coll.updateMany({ clubId }, { $set: { logoUri, "sys.mts": new Date().toISOString() } }),
    );
  }
}

export default new TeamDao();
