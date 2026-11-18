// Formátování čísel, dat a textů stránky Zajímavosti. Bez uu5 schválně: čte ho test v node
// (format.test.js).

const PLURAL = new Intl.PluralRules("cs-CZ");
// Data jako „7. 11. 2015“ v české zóně -- jako `DateText`, jen jako řetězec do titulků a aria-label.
const DATE = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Prague" });

/** „${name}“ v textu z LSI nahradí hodnotou z `params`. */
export function fill(template, params = {}) {
  return String(template ?? "").replace(/\$\{(\w+)\}/g, (all, key) => (key in params ? String(params[key]) : all));
}

/** Tvar z LSI `{ one, few, other }` podle počtu, s `${count}`. Desetinné číslo bere `other`. */
export function plural(forms, count) {
  if (!forms) return "";
  const rule = Number.isInteger(count) ? PLURAL.select(count) : "other";
  return fill(forms[rule] ?? forms.other, { count });
}

/** Desetinná čárka. */
export function num(value) {
  return String(value).replace(".", ",");
}

export function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

/** Podíl na zápas v procentech: od 10 % celé číslo, pod tím na desetinu (0,4 %). */
export function perMatch(count, appearances) {
  if (!appearances) return "—";
  const value = (count / appearances) * 100;
  return `${num(value >= 10 ? Math.round(value) : value.toFixed(1))} %`;
}

export function formatDate(iso) {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? DATE.format(date) : "—";
}

/** „7. 11. 2015 – 21. 5. 2016“ */
export function formatRange({ from, to } = {}) {
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function formatScore(home, guest) {
  return `${home ?? "–"}:${guest ?? "–"}`;
}

export function halfScore(match) {
  return Number.isFinite(match?.homeGoalsHalf) && Number.isFinite(match?.guestGoalsHalf)
    ? formatScore(match.homeGoalsHalf, match.guestGoalsHalf)
    : null;
}

/** „+12“, „−3“, „0“ */
export function signed(value) {
  return value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "0";
}

/** Body na zápas na dvě desetinná místa. */
export function pointsPerMatch({ played, wins, draws }) {
  return played ? num(((wins * 3 + draws) / played).toFixed(2)) : "0";
}

/** Pořadí se shodami: 1., 1., 3. -- shodný řádek dostane číslo toho nad ním. */
export function rankList(rowList, key) {
  const result = [];
  rowList.forEach((row, i) => {
    result.push(i > 0 && rowList[i - 1][key] === row[key] ? result[i - 1] : i + 1);
  });
  return result;
}
