// Obsahové stránky natvrdo v kódu.
//
// **Zatím se needitují přes API** (rozhodnuto 2026-09-06): entita `page` počká na ECC,
// protože obsahová stránka je přesně to, co ECC řeší, a stavět kvůli mezidobí druhou
// polovinu téhož by znamenalo napsat editaci dvakrát. Do té doby se text mění tady
// v kódu a nasazuje s buildem — což u stránek, které se přepisují jednou za rok, není
// horší než administrace, kterou nikdo neotevře.
//
// Obsah je **`uu5String`**, ne JSX: až ECC vznikne, přesune se odsud do databáze beze
// změny tvaru. Renderuje ho `Uu5.Content` (`routes/page.jsx`).
//
// `code` je zároveň routa — `/historie`, `/hymna`, … Adresy jsou převzaté z v0, takže
// staré odkazy sedí bez přesměrování.
//
// > **Texty jsou zatím kostry.** Skutečné znění se přepisuje z běžícího `afkbratcice.cz`;
// > historii klubu, jména výboru ani slova hymny si nevymýšlíme. Struktura je hotová,
// > doplnit se má text mezi značkami.

const PAGES = {
  historie: {
    name: "Historie klubu",
    desc: "Fotbal v Bratčicích od roku 1932 po dnešek.",
    content: `<uu5string/>
<p>Doplnit úvodní odstavec o historii klubu — text z afkbratcice.cz, sekce Historie.</p>
<h3>Milníky</h3>
<ul>
  <li><strong>1932</strong> — založení klubu</li>
  <li><strong>1948</strong> — doplnit</li>
  <li><strong>1972</strong> — doplnit</li>
  <li><strong>1992</strong> — doplnit</li>
  <li><strong>2005</strong> — doplnit</li>
  <li><strong>2012</strong> — doplnit</li>
  <li><strong>2022</strong> — doplnit</li>
</ul>
<p>Časová osa se z tohohle seznamu stane, jakmile budou v závislostech
<code>Uu5Bricks</code> a jeho <code>VerticalTimeline</code> (todo.md, 5.2).</p>`,
  },

  hymna: {
    name: "Hymna",
    desc: "Klubová hymna Traverza.",
    content: `<uu5string/>
<p>Doplnit text hymny „Traverza" z afkbratcice.cz.</p>`,
  },

  vybor: {
    name: "Výbor AFK",
    desc: "Lidé, kteří klub vedou.",
    // Výbor jde časem vzít z `coach/list?role=board` — jsou to osoby s rolí, ne text.
    // Do té doby platí totéž co u ostatních stránek: přepsat z v0, nevymýšlet.
    content: `<uu5string/>
<p>Doplnit sedm členů výboru z afkbratcice.cz, sekce Výbor — funkce, jméno, telefon, e-mail.</p>`,
  },

  treninky: {
    name: "Tréninky",
    desc: "Kdy a kde trénují jednotlivá mužstva.",
    content: `<uu5string/>
<p>Doplnit rozpis tréninků z afkbratcice.cz.</p>`,
  },

  "tymove-fotky": {
    name: "Týmové fotky",
    desc: "Mužstva AFK Bratčice od roku 1943.",
    content: `<uu5string/>
<p>Chronologie týmových fotek od roku 1943 — u každé fotka a jmenný seznam sestavy.
Fotky se nahrají do <code>BinaryStore</code> (kolekce <code>page</code>) a vloží sem
jako <code>UiElements.Image</code>.</p>`,
  },
};

/** Kódy stránek = jejich routy. */
const PAGE_CODE_LIST = Object.keys(PAGES);

export { PAGES, PAGE_CODE_LIST };
export default PAGES;
