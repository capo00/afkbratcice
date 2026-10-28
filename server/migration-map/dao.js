import { Dao } from "caio-server";

// Mapa v0 id -> _id, kterou plní migrace (tools/migrate-v0.js). Za běhu ji čte jen
// přesměrování starých adres (legacy-redirect.js).
class MigrationMapDao extends Dao {
  constructor() {
    super("afk_migration_map");
  }

  createIndexes() {
    return super.createIndex({ entity: 1, v0Id: 1 });
  }

  async findTargetId(entity, v0Id) {
    const found = await this.findOne({ entity, v0Id: String(v0Id) });
    return found?.targetId ?? null;
  }
}

export default new MigrationMapDao();
