import { Dao } from "caio-server";
import { membershipCondition } from "../services/membership.js";

// Vedení klubu: trenéři, asistenti a vedoucí týmů a výbor AFK. **Jeden záznam na osobu**
// (design/data-model.md, sekce 7) -- kdo trénuje dva týmy a sedí ve výboru, má jeden řádek
// se dvěma položkami `teamList` a jednou `boardList`.

class ManagementDao extends Dao {
  constructor() {
    super("afk_management");
  }

  createIndexes() {
    return Promise.all([
      super.createIndex({ personId: 1 }, { unique: true }),
      super.createIndex({ "teamList.id": 1 }),
      super.createIndex({ "boardList.role": 1 }),
    ]);
  }

  /**
   * @param teamId  působení v týmu (s `role` jen v této funkci)
   * @param board   true = členové výboru (s `role` jen v této funkci výboru)
   * @param role    funkce v týmu, nebo s `board` ve výboru
   * @param active  jen působení, které trvá dnes
   * @param range   `{ from, to }` = působení zasahuje do období (sezóny)
   */
  listByFilter({ teamId, board, role, active, range, idList } = {}, pageInfo) {
    if (idList) return this.listByIdList(idList);

    const filter = {};
    const period = { active, range };
    if (board) {
      const condition = membershipCondition(role ? { role } : {}, period);
      if (Object.keys(condition).length) filter.boardList = { $elemMatch: condition };
      else filter["boardList.0"] = { $exists: true };
    } else if (teamId || role) {
      const match = { ...(teamId ? { id: teamId } : null), ...(role ? { role } : null) };
      filter.teamList = { $elemMatch: membershipCondition(match, period) };
    }
    return this.find(filter, pageInfo);
  }
}

export default new ManagementDao();
