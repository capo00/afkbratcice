import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

// Jednotné formátování data a času. Jedno místo, kde se rozhoduje, jak web píše datum —
// jinak by každá obrazovka měla vlastní formát a rozpis zápasů by vypadal jinak než
// hlavička detailu.
//
// Sází to `Uu5Elements.DateTime`, ne vlastní `Intl`: bere jazyk z `useLanguage()`
// (SpaProvider ho drží na `cs`) a **časovou zónu z `useTimeZone()`**, takže se dá jedním
// providerem přepnout celé appce. U zápasů to není akademické — čas výkopu chodí ze serveru
// v ISO a má se zobrazit ve stejné zóně všem, ne podle nastavení notebooku.
//
// **Formáty jsou explicitní řetězce, ne `dateFormat="short|medium|long"`.** Ty totiž jdou
// přes `useUserPreferences`, a ta si vzory odvozuje z `Intl.DateTimeFormat(undefined, …)`,
// tedy z locale *prohlížeče* — na anglicky nastaveném stroji by z „12. 4. 2026" bylo
// „4/12/2026". Web je český, takže se vzor drží tady. Tokeny jsou z `uu_i18ng01`
// (`internal/custom-format.js`), momentovská sada.

const FORMAT = {
  // 12. 4. 2026
  date: "D. M. YYYY",
  // so 12. 4.
  dayMonth: "ddd D. M.",
  // 16:30
  time: "HH:mm",
  // 12. 4. 2026 16:30
  dateTime: "D. M. YYYY HH:mm",
};

// `dateLong` (12. dubna 2026) `DateTime` neumí a je to **vlastnost češtiny, ne opomenutí**:
// token `MMMM` volá `Intl` s `{ month: "long" }` samotným, což v češtině dává 1. pád
// („duben"). Genitiv „dubna" vrací `Intl` jen tehdy, když dostane den a měsíc dohromady
// (`{ day, month: "long", year }`) — a to přes formátovací řetězec nejde vyjádřit.
// Ověřeno v prohlížeči 8. 9. 2026: `D. MMMM YYYY` vysází „12. duben 2026".
//
// Proto tenhle jediný formát zůstává na `Intl`. Formatter je v modulové konstantě, ne
// v renderu — konstrukce `DateTimeFormat` je řádově dražší než samotné naformátování.
const LONG_FORMAT = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" });

const EMPTY = "—";

/** Vstup je ISO řetězec (tak zápasy chodí ze serveru) nebo `Date`; cokoli jiného -> null. */
function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DateText = createVisualComponent({
  uu5Tag: Config.TAG + "DateText",

  render({ value, type = "date" }) {
    const date = toDate(value);
    // Zápas bez termínu je běžný stav, ne chyba. Hlídat se to musí tady: `DateTime`
    // s prázdnou hodnotou vypíše **dnešek**, ne prázdno.
    if (!date) return EMPTY;
    if (type === "dateLong") return LONG_FORMAT.format(date);

    return <Uu5Elements.DateTime value={date} format={FORMAT[type] ?? FORMAT.date} />;
  },
});

export default DateText;
