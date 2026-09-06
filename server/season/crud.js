import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import matchDao from "../match/dao.js";
import teamDao from "../team/dao.js";
import appConfigCrud from "../app-config/crud.js";
import Config from "../config.js";
import { getYearFrom, sortByCategoryOrder } from "../services/season.js";

class SeasonCrud extends Crud {
  constructor() {
    super("season", dao);
  }

  async list({ age, teamId, yearFrom, pageInfo } = {}) {
    return (await dao.listByFilter({ age, teamId, yearFrom }, pageInfo)).map((item) => this._getData(item));
  }

  async listYears() {
    return dao.listYears();
  }

  async getCurrent({ age, teamId } = {}) {
    const yearFrom = getYearFrom();
    const found = teamId ? await dao.findCurrentByTeam(yearFrom, teamId) : await dao.findCurrentByAge(yearFrom, age);
    return found ? this._getData(found) : {};
  }

  /**
   * Kategorie, které klub v daném ročníku má.
   *
   * Zdroj pravdy jsou sezóny, ne konfigurace: složení mužstev se mění rok od roku
   * (letos Muži + Dorost + Žáci + Stará garda, za rok třeba jen Muži + Žáci). Vrací
   * jednu položku na kategorii -- z toho si klient staví menu i routy.
   */
  async listCurrent({ yearFrom } = {}) {
    const year = yearFrom || getYearFrom();
    const ownTeamList = await teamDao.listOwn();
    if (!ownTeamList.length) return [];

    const ownTeamIdList = ownTeamList.map((team) => team.id);
    const seasonList = await dao.listByYearAndTeams(year, ownTeamIdList);

    const itemList = seasonList.map((season) => {
      const team = ownTeamList.find((t) => season.teamList.includes(t.id) && t.age === season.age)
        // Kategorie týmu a sezóny se obvykle shodují; když ne, bereme první vlastní tým
        // v soutěži, aby položka menu nezmizela kvůli překlepu v datech.
        ?? ownTeamList.find((t) => season.teamList.includes(t.id));

      return {
        seasonId: season.id,
        yearFrom: season.yearFrom,
        age: season.age,
        competition: season.competition,
        teamId: team?.id ?? null,
        teamName: team?.name ?? null,
        // Soutěž s jediným účastníkem z klubu a bez dalších týmů tabulku nedává smysl
        // počítat -- stará garda hraje bez tabulky.
        hasTable: (season.teamList?.length ?? 0) > 1,
      };
    });

    const { categoryOrder } = await appConfigCrud.get();
    return sortByCategoryOrder(itemList, categoryOrder ?? Config.DEFAULT_APP_CONFIG.categoryOrder);
  }

  async delete(id) {
    // Ochrana proti osiřelým zápasům: smazaná sezóna by je odřízla od soutěže.
    const matchList = await matchDao.find({ seasonId: id }, { pageSize: 1 });
    if (matchList.length) {
      throw new CoreError("Season has matches and cannot be deleted", {
        status: 400,
        code: `${Config.ERROR_PREFIX}/season/hasMatches`,
        paramMap: { id },
      });
    }
    return super.delete(id);
  }
}

export default new SeasonCrud();
