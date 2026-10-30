import Config from "../config/config.js";
import "../fonts.css";

const { theme } = Config;

/**
 * Globální styly webu (písmo, reset, kotvy). Volá se jednou před prvním renderem z obou vstupů
 * (web `main.jsx`, admin `admin/index.jsx`), ať se nemůžou rozejít. Barvy obou režimů (CSS
 * proměnné, `body`) a klubovou červenou v uu5 (`primary`, oranžové `negative`) nastavuje stack
 * z package.json `caio.theme`.
 */
export function setupTheme() {
  // uu5g05 injektuje globální pravidlo `html { font-family: Roboto, ClearSans, sans-serif }`
  // a pro UI font NEEXISTUJE žádný token, kterým by se to dalo přebít. Jediná cesta je vlastní
  // global — náš `owner` je pozdější, takže vyhrává.
  //
  // Velikost písma se tu záměrně nenastavuje: tu řeší uuGds přes `Uu5Elements.Text`
  // (design/ux-design-system.md, 2.1). Global drží jen rodinu a reset.
  Config.Css.injectGlobal({
    html: {
      fontFamily: theme.font.body,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    "*, *::before, *::after": { boxSizing: "border-box" },
    // Kotvy (#program, #tabulky…) nesmí skončit pod sticky lištou.
    ":target": { scrollMarginBlockStart: theme.anchorOffset },
  });
}

export default setupTheme;
