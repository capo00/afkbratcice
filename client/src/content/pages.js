// Obsahové stránky — jejich seznam a názvy.
//
// **Rozdělené na dva soubory schválně.** Tenhle importuje `router.jsx` i `app.jsx`, aby
// věděly, jaké routy a položky menu vůbec existují, takže se veze v hlavním bundlu. Text
// stránek je proto vedle v `page-content.js`, který si natahuje až `routes/page.jsx` ve
// svém lazy chunku — jinak by každý návštěvník home stahoval i jmenné sestavy všech
// týmových fotek od roku 1943 (30 kB, které si otevře málokdo).
//
// `code` je zároveň routa — `/historie`, `/hymna`, … Adresy jsou převzaté z v0, takže
// staré odkazy sedí bez přesměrování.

const PAGES = {
  historie: {
    name: "Historie klubu",
    desc: "Fotbal v Bratčicích od roku 1932 po dnešek.",
  },

  hymna: {
    name: "Hymna",
    desc: "Klubová hymna Traverza.",
  },

  vybor: {
    name: "Výbor AFK",
    desc: "Lidé, kteří klub vedou.",
    // Výbor jde časem vzít z `coach/list?role=board` — jsou to osoby s rolí, ne text.
    // Do té doby je to text: v0 ho tak má a druhý zdroj pravdy (stránka i entita) by
    // znamenal udržovat totéž dvakrát. Migrace 2026 proto členy výboru do `coach`
    // vědomě nezakládá.
  },

  treninky: {
    name: "Tréninky",
    desc: "Kdy a kde trénují jednotlivá mužstva.",
    // v0 tabulka `trenink` končí rokem 2015, takže rozpis po mužstvech z čeho přepsat
    // není. Jediný aktuální údaj je proužek „Upozornění" na v0 — a ten se sem nekopíruje
    // podruhé, drží ho `appConfig.notice` a vykresluje rám nad každou stránkou.
  },

  "tymove-fotky": {
    name: "Týmové fotky",
    desc: "Mužstva AFK Bratčice od roku 1943.",
  },
};

/** Kódy stránek = jejich routy. */
const PAGE_CODE_LIST = Object.keys(PAGES);

export { PAGES, PAGE_CODE_LIST };
export default PAGES;
