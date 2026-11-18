import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Forms from "uu5g05-forms";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";

// Odjezd na zápas (Caio 2026-11-18): vybírá se **jen čas**, datum je den zápasu. `FormTime`
// s `date` vrací ISO datum a čas toho dne v dané zóně, takže se ukládá stejný tvar jako
// výkop (`time`). Když se zápas přesune, server odjezd posadí na nový den se stejným časem
// (`server/match/crud.js`, `_withDeparture`) -- formulář proto nemusí nic přepočítávat.

const TIME_ZONE = "Europe/Prague";
// en-CA píše datum jako YYYY-MM-DD, tedy tvar, který chce `date`.
const DAY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** „2026-11-15“ -- den výkopu v české zóně, nebo `undefined`, když termín není. */
function matchDay(time) {
  const date = time ? new Date(time) : null;
  return date && !Number.isNaN(date.getTime()) ? DAY_FORMAT.format(date) : undefined;
}

const DepartureTimeInput = createVisualComponent({
  uu5Tag: Config.TAG + "DepartureTimeInput",

  render(props) {
    const { value } = Uu5Forms.useFormApi();
    const date = matchDay(value?.time);

    return (
      <Uu5Forms.FormTime
        {...props}
        date={date}
        timeZone={TIME_ZONE}
        // Bez termínu zápasu není den, ke kterému by se čas vztáhl.
        disabled={!date}
        infoMessage={date ? undefined : <Lsi import={importLsi} path={["admin", "field", "departureTimeNoDate"]} />}
      />
    );
  },
});

export { DepartureTimeInput, matchDay };
export default DepartureTimeInput;
