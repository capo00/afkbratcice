import Config from "../config.js";
import seasonDao from "../season/dao.js";

// Členství v čase (`{ dateFrom, dateTo }`, data `YYYY-MM-DD`, `dateTo: null` = trvá) mají
// hráči v týmech a vedení v týmech i ve výboru. Tady je jediné místo, které z nich skládá
// Mongo podmínku pro `$elemMatch` -- „aktivní dnes“ a „v sezóně“ jsou totéž překrytí období,
// jen s jiným intervalem.

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Období ročníku: od 1. dne startovního měsíce `yearFrom` do posledního dne před ním
 * o rok později (sezóna 2025 = 2025-08-01 … 2026-07-31).
 */
function seasonRange(yearFrom) {
  const from = Number(yearFrom);
  const month = String(Config.SEASON_START_MONTH).padStart(2, "0");
  const end = new Date(Date.UTC(from + 1, Config.SEASON_START_MONTH - 1, 0)).toISOString().slice(0, 10);
  return { from: `${from}-${month}-01`, to: end };
}

/** Období sezóny podle id; neexistující sezóna = `null` (volající vrátí prázdný seznam). */
async function seasonRangeOf(seasonId) {
  const season = await seasonDao.get(seasonId).catch(() => null);
  return season ? seasonRange(season.yearFrom) : null;
}

/**
 * Podmínka členství, které se překrývá s obdobím `{ from, to }`. `{ field: null }` v Mongu
 * sedí i na chybějící pole, takže chybějící začátek = „odjakživa“, chybějící konec = „trvá“.
 */
function overlapCondition({ from, to }) {
  return {
    $and: [
      { $or: [{ dateFrom: null }, { dateFrom: { $lte: to } }] },
      { $or: [{ dateTo: null }, { dateTo: { $gte: from } }] },
    ],
  };
}

/**
 * Podmínka pro `$elemMatch` nad seznamem členství.
 *
 * @param match   pole, která musí položka mít (`{ id: teamId }`, `{ role }`)
 * @param active  true = členství trvá dnes
 * @param range   `{ from, to }` = členství zasahuje do období (sezóny)
 */
function membershipCondition(match = {}, { active, range } = {}) {
  const condition = { ...match };
  const periodList = [];
  if (active) periodList.push(overlapCondition({ from: today(), to: today() }));
  if (range) periodList.push(overlapCondition(range));
  if (periodList.length) condition.$and = periodList.flatMap((p) => p.$and);
  return condition;
}

/** Trvá členství dnes? Totéž co `membershipCondition({}, { active: true })`, nad objektem. */
function isActive(membership, day = today()) {
  return (!membership.dateFrom || membership.dateFrom <= day) && (!membership.dateTo || membership.dateTo >= day);
}

export { seasonRange, seasonRangeOf, membershipCondition, isActive };
