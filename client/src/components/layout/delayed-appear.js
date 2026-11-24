import Config from "../../config/config.js";

// Zpožděné objevení čekacích stavů (Skeleton, PageLoading): prvních 400 ms průhledné, pak se za
// 100 ms prolnou (Caio 2026-11-24). Rychlé načtení (dobrá síť, cache, přechod mezi stránkami
// lokálně ~200 ms) tak šedou plochu ani kruh vůbec neukáže; pomalé ano. Místo drží prvek od
// prvního snímku, takže se nic neposouvá.
//
// Čisté CSS, žádný časovač ani stav: zpoždění běží od vložení prvku do DOM, takže každé nové
// čekání (i „Zkusit znovu“) začíná znovu. Bez pohybu (`prefers-reduced-motion`) zpoždění zůstává,
// prolnutí ne.

export const APPEAR_DELAY_MS = 400;
export const APPEAR_FADE_MS = 100;

const KEYFRAMES = "afk-delayed-appear";

Config.Css.injectGlobal({
  [`@keyframes ${KEYFRAMES}`]: { from: { opacity: 0 }, to: { opacity: 1 } },
});

/** Styl pro `Config.Css.css()`: prvek je `APPEAR_DELAY_MS` průhledný, pak se prolne. */
export const DELAYED_APPEAR = {
  animation: `${KEYFRAMES} ${APPEAR_FADE_MS}ms ease-out ${APPEAR_DELAY_MS}ms both`,
  "@media (prefers-reduced-motion: reduce)": {
    animationDuration: "1ms",
  },
};
