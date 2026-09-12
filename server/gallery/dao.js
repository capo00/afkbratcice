import { Dao } from "caio-server";

class GalleryDao extends Dao {
  constructor() {
    super("afk_gallery");
  }

  createIndexes() {
    return Promise.all([
      super.createIndex({ date: -1 }),
      super.createIndex({ state: 1, date: -1 }),
      super.createIndex({ matchId: 1 }, { sparse: true }),
      super.createIndex({ category: 1, date: -1 }),
    ]);
  }

  listByFilter({ state, seasonId, matchId, category } = {}, pageInfo) {
    const filter = {};
    if (state) filter.state = state;
    if (seasonId) filter.seasonId = seasonId;
    if (matchId) filter.matchId = matchId;
    if (category) filter.category = category;
    return this.find(filter, pageInfo, { date: -1 });
  }
}

export default new GalleryDao();
