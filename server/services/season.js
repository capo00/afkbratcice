import Config from "../config.js";

/**
 * Ročník, do kterého datum spadá. Sezóna začíná v srpnu, takže 5. 3. 2026 patří do
 * ročníku 2025 (tedy 2025/26). Převzato z v1 `season-dao.getCurrentByTeam`.
 */
function getYearFrom(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  return String(d.getMonth() + 1 < Config.SEASON_START_MONTH ? year - 1 : year);
}

/** „2025" -> „2025/26" pro zobrazení. */
function formatSeason(yearFrom) {
  const from = Number(yearFrom);
  if (!Number.isFinite(from)) return String(yearFrom ?? "");
  return `${from}/${String((from + 1) % 100).padStart(2, "0")}`;
}

/**
 * Seřadí kategorie podle appConfig.categoryOrder; co v pořadí není, jde na konec
 * (abecedně, ať je výsledek stabilní).
 */
function sortByCategoryOrder(itemList, categoryOrder = []) {
  return [...itemList].sort((a, b) => {
    const ia = categoryOrder.indexOf(a.age);
    const ib = categoryOrder.indexOf(b.age);
    if (ia === ib) return String(a.age).localeCompare(String(b.age), "cs");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export { getYearFrom, formatSeason, sortByCategoryOrder };
