// Datum milníku historie v přesnosti, jakou zdroj zná: rok, měsíc, den, rozsah, desetiletí, nebo
// volný text („Po druhé světové válce“, „Dnes“). Bez uu5 importů, aby šlo testovat v node.
//
// Vrací `{ parts: [{ text, dateTime? }], separator }`: `dateTime` je hodnota pro `<time>`, které ho
// má jen datum v platném formátu (desetiletí a volný text ne). Rozsah se píše s en dash: bez mezer
// mezi dvěma roky („2020–2021“), s mezerami, když je aspoň jedna strana přesnější než rok.
// Den má nedělitelné mezery („6. 7. 2019“ se nezalomí). Verzálky dělá až CSS, text zůstává
// v sentence case, aby ho čtečka nečetla po písmenech.

const MONTH = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
const DECADE = {
  1920: "Dvacátá",
  1930: "Třicátá",
  1940: "Čtyřicátá",
  1950: "Padesátá",
  1960: "Šedesátá",
  1970: "Sedmdesátá",
  1980: "Osmdesátá",
  1990: "Devadesátá",
};
const NBSP = " ";
const pad = (n) => String(n).padStart(2, "0");

function point({ year, month, day }) {
  if (day) return { text: `${day}.${NBSP}${month}.${NBSP}${year}`, dateTime: `${year}-${pad(month)}-${pad(day)}` };
  if (month) return { text: `${MONTH[month - 1]} ${year}`, dateTime: `${year}-${pad(month)}` };
  return { text: String(year), dateTime: String(year) };
}

export function formatHistoryDate(date = {}) {
  if (date.text) return { parts: [{ text: date.text }], separator: "" };
  if (date.decade) return { parts: [{ text: `${DECADE[date.decade] ?? `${date.decade}.`} léta` }], separator: "" };
  if (!date.to) return { parts: [point(date)], separator: "" };
  const precise = Boolean(date.month || date.to.month);
  return { parts: [point(date), point(date.to)], separator: precise ? " – " : "–" };
}

/** Text data bez značek („červen 2021“), např. pro `aria-label` nebo testy. */
export function historyDateText(date) {
  const { parts, separator } = formatHistoryDate(date);
  return parts.map((part) => part.text).join(separator);
}
