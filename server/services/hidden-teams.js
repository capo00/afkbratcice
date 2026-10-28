import appConfigCrud from "../app-config/crud.js";
import categoryDao from "../category/dao.js";
import teamDao from "../team/dao.js";

// Které týmy a věkové skupiny mají skrytá jména (pravidla v services/hidden-names.js).
// Čte se při každém dotazu: konfigurace i kategorie se mění v administraci a týmů je
// pár desítek, takže cache by přinesla jen otázku, kdy ji zneplatnit.

/** Věkové skupiny z `appConfig.hideNamesAgeList`. */
async function loadHiddenAgeList() {
  return (await appConfigCrud.get()).hideNamesAgeList ?? [];
}

/** Id týmů, jejichž kategorie má skrytý věk. */
async function loadHiddenTeamIdSet(hiddenAgeList) {
  const ageList = hiddenAgeList ?? (await loadHiddenAgeList());
  if (!ageList.length) return new Set();

  const categoryList = (await Promise.all(ageList.map((age) => categoryDao.listByAge(age)))).flat();
  if (!categoryList.length) return new Set();

  const teamList = await teamDao.listByFilter({ categoryList: categoryList.map((c) => c.code) });
  return new Set(teamList.map((team) => team.id));
}

export { loadHiddenAgeList, loadHiddenTeamIdSet };
