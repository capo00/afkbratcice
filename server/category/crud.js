import { Crud, Error as CoreError } from "caio-server";
import dao from "./dao.js";
import teamDao from "../team/dao.js";
import Config from "../config.js";

// Kód kategorie: malá písmena, číslice a pomlčky (men-a, u15-b). Je to klíč, na který odkazují
// týmy (`team.category`), proto se po založení nemění.
const CODE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Kategorie týmu (design/data-model.md, 2.3): A/B/C týmy mužů, rezervy mládeže, ženy,
 * stará garda. `age` je věková skupina, podle které se hlídá, kdo proti komu smí hrát
 * mistrovský zápas (match/crud.js).
 */
class CategoryCrud extends Crud {
  constructor() {
    super("category", dao);
  }

  /**
   * Seřazené automaticky: podle věkové skupiny (pořadí `Config.AGE_LIST`), uvnitř podle kódu
   * (Caio 2026-10-26, ruční pořadí se nezavádí). `teamCount` = kolik týmů kategorii používá;
   * administrace podle něj vysvětluje, proč kód nejde změnit a kategorii smazat.
   */
  async list() {
    const [itemList, countList] = await Promise.all([dao.find({}, undefined, { code: 1 }), teamDao.countByCategory()]);
    const countOf = (code) => countList.find((c) => c.category === code)?.count ?? 0;
    const ageIndex = (age) => {
      const i = Config.AGE_LIST.indexOf(age);
      return i === -1 ? Config.AGE_LIST.length : i;
    };
    return itemList
      .sort((a, b) => ageIndex(a.age) - ageIndex(b.age) || a.code.localeCompare(b.code))
      .map((item) => ({ ...this._getData(item), teamCount: countOf(item.code) }));
  }

  async create(data) {
    if (!CODE_PATTERN.test(data.code ?? "")) throw this._error("invalidCode", "Code may contain only a-z, 0-9 and dashes", { code: data.code });
    if (!data.name) throw this._error("nameRequired", "Name is required", {});
    if (!Config.AGE_LIST.includes(data.age)) throw this._error("invalidAge", "Unknown age group", { age: data.age });
    if (await dao.findByCode(data.code)) throw this._error("codeExists", "Category with this code already exists", { code: data.code });
    return super.create({ code: data.code, name: data.name, age: data.age });
  }

  async update(data) {
    const current = await this._get(data.id);
    // Týmy odkazují kódem, takže změna kódu by je odřízla od kategorie.
    if (data.code !== undefined && data.code !== current.code) {
      throw this._error("codeImmutable", "Category code cannot be changed", { code: current.code });
    }
    if (data.name !== undefined && !data.name) throw this._error("nameRequired", "Name is required", {});
    if (data.age !== undefined && !Config.AGE_LIST.includes(data.age)) {
      throw this._error("invalidAge", "Unknown age group", { age: data.age });
    }
    // Změna věkové skupiny u použité kategorie by zpětně zneplatnila mistrovské zápasy jejích
    // týmů (services/category.js) -- ty by pak nešlo ani upravit.
    if (data.age !== undefined && data.age !== current.age) {
      const inUse = await teamDao.find({ category: current.code }, { pageSize: 1 });
      if (inUse.length) throw this._error("ageInUse", "Age group of a used category cannot be changed", { code: current.code });
    }
    const { code, ...rest } = data;
    return super.update(rest);
  }

  async delete(id) {
    const current = await this._get(id);
    const inUse = await teamDao.find({ category: current.code }, { pageSize: 1 });
    if (inUse.length) throw this._error("inUse", "Category is used by a team", { id, code: current.code });
    return super.delete(id);
  }

  _error(code, message, paramMap) {
    return new CoreError(message, { status: 400, code: `${Config.ERROR_PREFIX}/category/${code}`, paramMap });
  }
}

export default new CategoryCrud();
