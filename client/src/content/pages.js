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
    // Obsah není text, ale členové výboru ze záznamů vedení (`management/list?board=true`,
    // `components/board.jsx`); do 2026-11 to byl text v `page-content.js`.
  },

  // Stránka `treninky` (z v0) zrušena 2026-11-04: rozpis tréninků nikdo neudržuje,
  // aktuální termíny jdou přes proužek `appSettings.notice`. Stará adresa vede na úvod
  // (`server/legacy-redirect.js`).

  "tymove-fotky": {
    name: "Týmové fotky",
    desc: "Mužstva AFK Bratčice od roku 1943.",
  },
};

/** Kódy stránek = jejich routy. */
const PAGE_CODE_LIST = Object.keys(PAGES);

export { PAGES, PAGE_CODE_LIST };
export default PAGES;
