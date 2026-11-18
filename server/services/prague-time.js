// Čas v české zóně bez knihovny: `Intl` umí z UTC udělat místní čas, opačný směr se dopočítá
// z posunu zóny v daný okamžik (letní/zimní čas). Používá ho odjezd zápasu (`match/crud.js`)
// a migrace starých odjezdů (`tools/migrate-departure-time.js`).

const TIME_ZONE = "Europe/Prague";

const FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Starý tvar odjezdu z v0: jen místní čas („15:45:00“), datum je den zápasu.
const CLOCK = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Místní datum a čas okamžiku v české zóně jako čísla. */
function pragueParts(instant) {
  const parts = Object.fromEntries(
    FORMAT.formatToParts(new Date(instant))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: parts.minute, second: parts.second };
}

/** „2026-11-15“ -- den okamžiku v české zóně. */
function pragueDate(instant) {
  const { year, month, day } = pragueParts(instant);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Okamžik z českého data a času. Posun zóny se bere v odhadnutém okamžiku a ještě jednou
 * v opraveném -- kolem přechodu na letní čas se ty dva liší o hodinu.
 */
function fromPrague({ year, month, day, hour = 0, minute = 0, second = 0 }) {
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = wall;
  for (let i = 0; i < 2; i++) {
    const p = pragueParts(instant);
    const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant;
    instant = wall - offset;
  }
  return new Date(instant);
}

/**
 * Odjezd na den zápasu: místní čas odjezdu (z ISO, nebo ze starého „HH:MM[:SS]“) a místní
 * datum výkopu. Vrací ISO v UTC, nebo `null`, když se z hodnot nedá nic poskládat.
 */
function departureOnMatchDay(departureTime, matchTime) {
  if (!departureTime || !matchTime || Number.isNaN(new Date(matchTime).getTime())) return null;
  const legacy = CLOCK.exec(String(departureTime));
  let clock;
  if (legacy) clock = { hour: Number(legacy[1]), minute: Number(legacy[2]), second: Number(legacy[3] ?? 0) };
  else if (!Number.isNaN(new Date(departureTime).getTime())) clock = pragueParts(departureTime);
  else return null;
  const { year, month, day } = pragueParts(matchTime);
  return fromPrague({ year, month, day, hour: clock.hour, minute: clock.minute, second: clock.second }).toISOString();
}

export { TIME_ZONE, pragueParts, pragueDate, fromPrague, departureOnMatchDay };
