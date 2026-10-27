import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import clubDao from "../club/dao.js";
import categoryDao from "../category/dao.js";
import Config from "../config.js";

/**
 * Logo týmu je od 2026-09-11 odvozené od `club` (design/data-model.md, 1.2) -- `logoUri`
 * na týmu zůstává jen jako denormalizace pro čtení, ale při změně loga ji přepisuje
 * výhradně `ClubCrud`/`TeamDao.updateLogoUriByClub`. Tahle vrstva ji dopočítává jen ve
 * chvíli, kdy se mění `clubId` -- tam totiž `updateLogoUriByClub` nezasáhne, protože se
 * spouští z opačné strany vazby.
 */
class TeamCrud extends Crud {
  constructor() {
    super("team", dao);
  }

  async list({ age, category, own, idList, pageInfo } = {}) {
    let categoryList;
    if (category) categoryList = [category];
    else if (age) categoryList = (await categoryDao.listByAge(age)).map((c) => c.code);
    return (await dao.listByFilter({ categoryList, own, idList }, pageInfo)).map((item) => this._getData(item));
  }

  async create(data) {
    await this._checkCategory(data.category, true);
    const club = await clubDao.get(data.clubId);
    return super.create({ ...data, logoUri: club?.logoUri ?? null });
  }

  async update(data) {
    await this._checkCategory(data.category, false);
    if (data.clubId === undefined) return super.update(data);
    const club = await clubDao.get(data.clubId);
    return super.update({ ...data, logoUri: club?.logoUri ?? null });
  }

  /** Tým musí patřit do existující kategorie (`afk_category.code`). */
  async _checkCategory(code, required) {
    if (code === undefined && !required) return;
    if (code && (await categoryDao.findByCode(code))) return;
    throw new CoreError("Unknown category", {
      status: 400,
      code: `${Config.ERROR_PREFIX}/team/invalidCategory`,
      paramMap: { category: code },
    });
  }
}

export default new TeamCrud();
