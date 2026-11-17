// How a season is named, in one place (review 2026-11-12, 1.3: two `seasonLabel`s with different
// output, one of them breaking on a missing year).
//
// The server keeps `yearFrom` (a season starts in August), but nobody calls a football season by
// one number, so it is shown as "2025/26". Plain module without uu5, so node tests read it.

/** "2025/26"; without a usable year the stored value, or "—". */
export function seasonYears(season) {
  const from = Number(season?.yearFrom);
  if (!season?.yearFrom || !Number.isFinite(from)) return season?.yearFrom ?? "—";
  return `${from}/${String((from + 1) % 100).padStart(2, "0")}`;
}

/** "III. třída 2025/26" -- a season among others (selects, page titles). */
export function seasonName(season) {
  return [season?.competition, seasonYears(season)].filter(Boolean).join(" ");
}
