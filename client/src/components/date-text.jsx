import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";

// Jednotné formátování data a času. Jedno místo, kde se rozhoduje, jak web píše datum —
// jinak by každá obrazovka měla vlastní `toLocaleDateString` s jinými parametry a rozpis
// zápasů by vypadal jinak než hlavička detailu.
//
// `Intl` se drží v modulových konstantách, ne v renderu: konstrukce `DateTimeFormat` je
// řádově dražší než samotné naformátování a v tabulce zápasů se komponenta renderuje
// desetkrát na obrazovku.
//
// Vstup je ISO řetězec (tak zápasy chodí ze serveru) nebo `Date`. Neplatná hodnota vrací
// pomlčku, ne "Invalid Date" — zápas bez termínu je běžný stav, ne chyba.

const FORMAT = {
  // 12. 4. 2026
  date: new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }),
  // 12. dubna 2026
  dateLong: new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }),
  // so 12. 4.
  dayMonth: new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" }),
  // 16:30
  time: new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" }),
  // 12. 4. 2026 16:30
  dateTime: new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }),
};

const EMPTY = "—";

function format(value, type = "date") {
  if (!value) return EMPTY;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return (FORMAT[type] ?? FORMAT.date).format(date);
}

const DateText = createVisualComponent({
  uu5Tag: Config.TAG + "DateText",

  render({ value, type }) {
    return format(value, type);
  },
});

export { format };
export default DateText;
