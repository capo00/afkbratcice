import { Dao } from "caio-server";

class AppConfigDao extends Dao {
  constructor() {
    super("app_config");
  }

  /** Singleton: v kolekci je nejvýš jeden dokument. */
  async findSingleton() {
    const list = await this.find({}, { pageSize: 1 });
    return list[0] ?? null;
  }
}

export default new AppConfigDao();
