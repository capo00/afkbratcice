// iCal export rozpisu týmu -- člověk si zápasy přidá do telefonu a víc web nepotřebuje.
// Vychází z caio_propertyman/server/services/ical-export.js.

function pad(n) {
  return String(n).padStart(2, "0");
}

/** iCal chce UTC ve tvaru 20260905T170000Z. */
function toIcalDate(value) {
  const d = new Date(value);
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/**
 * RFC 5545: escapovat zpětné lomítko, čárku, středník a nový řádek.
 *
 * Zpětná lomítka v náhradě musí být zdvojená (`"\\$1"`, `"\\n"`). Do 2026-09-09 tu stálo
 * `"\$1"` a `"\n"`, což JS čte jako `"$1"` a jako skutečný konec řádku -- funkce tedy
 * vracela vstup beze změny. Projevilo by se to až na čárce v názvu soupeře nebo v místě
 * konání (rozbité pole) a na poznámce přes dva řádky (rozbitý celý kalendář).
 */
function escapeText(value) {
  return String(value ?? "").replace(/([\\,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
}

/** Řádky delší než 75 oktetů se lámou a pokračovací řádek začíná mezerou. */
function fold(line) {
  if (line.length <= 75) return line;
  const parts = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

const MATCH_DURATION_MS = 105 * 60 * 1000; // 2 x 45 minut plus poločas

function buildCalendar({ name, matchList, teamMap, host }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AFK Bratcice//Rozpis//CS",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
  ];

  for (const match of matchList) {
    if (!match.time) continue; // termín neurčen -- do kalendáře nepatří
    const home = teamMap.get(match.homeTeamId)?.name ?? "?";
    const guest = teamMap.get(match.guestTeamId)?.name ?? "?";
    const start = new Date(match.time);

    lines.push(
      "BEGIN:VEVENT",
      `UID:match-${match.id}@${host}`,
      `DTSTAMP:${toIcalDate(new Date())}`,
      `DTSTART:${toIcalDate(start)}`,
      `DTEND:${toIcalDate(new Date(start.getTime() + MATCH_DURATION_MS))}`,
      fold(`SUMMARY:${escapeText(`${home} – ${guest}`)}`),
      fold(`DESCRIPTION:${escapeText([match.round ? `${match.round}. kolo` : "Přátelský zápas", match.note].filter(Boolean).join(" · "))}`),
      fold(`LOCATION:${escapeText(match.place ?? "")}`),
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export { buildCalendar };
