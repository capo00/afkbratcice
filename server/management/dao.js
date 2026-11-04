import { Dao } from "caio-server";
import { membershipCondition } from "../services/membership.js";

// Vedení klubu: trenéři, asistenti a vedoucí týmů a výbor AFK. **Jeden záznam = jedna osoba
// v jedné funkci v jednom období** (design/data-model.md, sekce 7): `{ personId, teamId, role,
// dateFrom, dateTo }`, `teamId: null` = výbor. Kdo trénuje dva týmy a sedí ve výboru, má tři
// záznamy. Do 2026-11 byl záznam na osobu s vnořenými `teamList`/`boardList`
// (převod: tools/migrate-management-flat.js).

class ManagementDao extends Dao {
  constructor() {
    super("afk_management");
  }

  createIndexes() {
    return Promise.all([super.createIndex({ teamId: 1, role: 1 }), super.createIndex({ personId: 1 })]);
  }

  /**
   * @param teamId    funkce v tomto týmu
   * @param board     true = funkce ve výboru (`teamId: null`); má přednost před `teamId`
   * @param role      funkce
   * @param personId  funkce této osoby
   * @param active    jen funkce, které trvají dnes
   * @param range     `{ from, to }` = funkce zasahuje do období (sezóny)
   */
  listByFilter({ teamId, board, role, personId, active, range, idList } = {}, pageInfo) {
    if (idList) return this.listByIdList(idList);

    const match = {
      // `{ teamId: null }` v Mongu sedí i na chybějící pole -- výbor tak najde i záznam bez něj.
      ...(board ? { teamId: null } : teamId ? { teamId } : null),
      ...(role ? { role } : null),
      ...(personId ? { personId } : null),
    };
    return this.find(membershipCondition(match, { active, range }), pageInfo);
  }

  /** Funkce téže osoby ve stejném týmu/výboru a stejné funkci -- kandidáti na překryv. */
  listSameRole({ personId, teamId, role }) {
    return this.find({ personId, teamId: teamId ?? null, role }, { pageSize: 1000 });
  }
}

export default new ManagementDao();
