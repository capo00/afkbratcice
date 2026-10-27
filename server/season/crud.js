import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import matchDao from "../match/dao.js";
import teamDao from "../team/dao.js";
import categoryDao from "../category/dao.js";
import appConfigCrud from "../app-config/crud.js";
import Config from "../config.js";
import { getYearFrom, sortByCategoryOrder } from "../services/season.js";

class SeasonCrud extends Crud {
  constructor() {
    super("season", dao);
  }

  async list({ age, teamId, yearFrom, idList, pageInfo } = {}) {
    return (await dao.listByFilter({ age, teamId, yearFrom, idList }, pageInfo)).map((item) => this._getData(item));
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
   * Mužstva, která klub v daném ročníku má -- jedna položka na vlastní tým v sezóně.
   *
   * Zdroj pravdy jsou sezóny, ne konfigurace: složení mužstev se mění rok od roku. Sezóna
   * patří věkové skupině (`season.age`), mužstvo kategorii (`team.category`), takže když
   * klub v jedné soutěži mužů hraje s A i B týmem, vrátí se dvě položky. Klient si z nich
   * staví menu i routy.
   */
  async listCurrent({ yearFrom } = {}) {
    const year = yearFrom || getYearFrom();
    const ownTeamList = await teamDao.listOwn();
    if (!ownTeamList.length) return [];

    const ownTeamIdList = ownTeamList.map((team) => team.id);
    const seasonList = await dao.listByYearAndTeams(year, ownTeamIdList);
    const categoryList = await categoryDao.listByCodeList([...new Set(ownTeamList.map((t) => t.category))]);
    const categoryOf = (team) => categoryList.find((c) => c.code === team.category);

    const itemList = seasonList.flatMap((season) => {
      const inSeason = ownTeamList.filter((t) => season.teamList.includes(t.id));
      const sameAge = inSeason.filter((t) => categoryOf(t)?.age === season.age);
      // Kategorie týmu a věk sezóny se obvykle shodují; když ne, bereme první vlastní tým
      // v soutěži, aby položka menu nezmizela kvůli překlepu v datech.
      const teamList = sameAge.length ? sameAge : inSeason.slice(0, 1);

      return teamList.map((team) => ({
        seasonId: season.id,
        yearFrom: season.yearFrom,
        age: season.age,
        category: team.category ?? null,
        categoryName: categoryOf(team)?.name ?? null,
        competition: season.competition,
        teamId: team.id,
        teamName: team.name,
        // Soutěž s jediným účastníkem z klubu a bez dalších týmů tabulku nedává smysl
        // počítat -- stará garda hraje bez tabulky.
        hasTable: (season.teamList?.length ?? 0) > 1,
        // Bodování tabulky (3/2/1/0 vs. 3/1/0). Klient podle toho kreslí sloupce VP/PP,
        // nebo R -- odvozovat to z dat nejde, viz services/table.js.
        hasPenalties: Boolean(season.hasPenalties),
      }));
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
