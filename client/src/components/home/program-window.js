// Time window of the home "Program víkendu" section (weekend-program.jsx).

const DAY_MS = 24 * 60 * 60 * 1000;

// The window is **a week ahead**, not "the next Saturday and Sunday": catch-up matches are
// played during the week and youth teams often play on a weekday. A fixed weekend would hide them.
export const WINDOW_DAYS = 7;

// A match that has already been played stays in the program until its result is entered
// (Caio 2026-11-10): "Poslední výsledky" show only matches with a score, so without this the
// editor could not reach a Saturday match on Sunday with the pencil. The lookback is bounded so
// that a result forgotten for weeks does not hang on the home page forever -- the admin still
// lists it.
export const UNPLAYED_LOOKBACK_DAYS = 14;

const SKIPPED_STATE_LIST = ["postponed", "canceled"];

function startOfDay(now) {
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** `match/list` range: from the lookback to a week ahead of today's midnight. */
export function programRange(now = new Date()) {
  const today = startOfDay(now);
  return {
    dateFrom: new Date(today.getTime() - UNPLAYED_LOOKBACK_DAYS * DAY_MS).toISOString(),
    dateTo: new Date(today.getTime() + WINDOW_DAYS * DAY_MS).toISOString(),
  };
}

/**
 * Whether the match belongs to the program: everything from today's midnight on, and from the
 * days before only a match without a result. Postponed and canceled matches will not get a
 * result, so they do not stay.
 */
export function isInProgram(match, now = new Date()) {
  if (match.time && match.time >= startOfDay(now).toISOString()) return true;
  return match.homeGoals == null && !SKIPPED_STATE_LIST.includes(match.state);
}
