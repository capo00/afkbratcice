import { Crud } from "caio-server";
import dao from "./dao.js";
import clubDao from "../club/dao.js";

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

  async list({ age, own, idList, pageInfo } = {}) {
    return (await dao.listByFilter({ age, own, idList }, pageInfo)).map((item) => this._getData(item));
  }

  async create(data) {
    const club = await clubDao.get(data.clubId);
    return super.create({ ...data, logoUri: club?.logoUri ?? null });
  }

  async update(data) {
    if (data.clubId === undefined) return super.update(data);
    const club = await clubDao.get(data.clubId);
    return super.update({ ...data, logoUri: club?.logoUri ?? null });
  }
}

export default new TeamCrud();
