import { createVisualComponent, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";

// Posledních pár výsledků jako kolečka V-R-P. Standard na moderních fotbalových webech
// a na serveru to nic nestojí — `computeTable` pole `form` naplní ze stejného průchodu
// daty, ze kterého počítá body.
//
// Pořadí je **chronologické**: vlevo nejstarší z nich, vpravo poslední odehraný zápas.
// Řadí ho server, klient pole jen vykreslí tak, jak přišlo — jinak by API tvrdilo jedno
// a tabulka ukazovala druhé.
//
// Kolečko je `Uu5Elements.Badge` s `borderRadius="full"`; tři vzhledy nejsou tři sady barev,
// ale tři GDS `significance` nad tvarem `interactiveElement` (pozor, jinak než u `ground`):
// `highlighted` = plná výplň, `common` = jemná výplň, `distinct` = jen obrys. Výhra k tomu
// bere klubovou červenou přes `colorScheme="primary"`.
//
// Písmeno uvnitř je tam schválně — samotná barva by pro barvoslepé nesla nulovou informaci
// a tabulka je hustá, takže tooltip nikdo neotevře.

const BADGE = {
  W: { colorScheme: "primary", significance: "highlighted", letter: "V" },
  D: { colorScheme: "building", significance: "common", letter: "R" },
  L: { colorScheme: "building", significance: "distinct", letter: "P" },
};

// Neznámý kód ze serveru se nemá ztratit ani shodit řádek — vypadá jako prohra, ale s "?".
const UNKNOWN = { colorScheme: "building", significance: "distinct", letter: "?" };

const FormDots = createVisualComponent({
  uu5Tag: Config.TAG + "FormDots",

  render({ form }) {
    const label = useLsi(importLsi, ["table", "form"]);
    if (!form?.length) return null;

    return (
      <span
        aria-label={label}
        className={Config.Css.css({ display: "inline-flex", gap: 4, verticalAlign: "middle" })}
      >
        {form.map((result, index) => {
          const { colorScheme, significance, letter } = BADGE[result] ?? UNKNOWN;
          return (
            // `size="l"` je 20 px z GDS (`spot/minor`), nejblíž k 18 px z předlohy.
            <Uu5Elements.Badge
              key={index}
              size="l"
              borderRadius="full"
              colorScheme={colorScheme}
              significance={significance}
            >
              {letter}
            </Uu5Elements.Badge>
          );
        })}
      </span>
    );
  },
});

export default FormDots;
