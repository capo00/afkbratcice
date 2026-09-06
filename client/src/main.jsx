import { createRoot } from "react-dom/client";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import App from "./app.jsx";
import "./fonts.css";

const { theme } = Config;

// uu5g05 injektuje globální pravidlo `html { font-family: Roboto, ClearSans, sans-serif }`
// a pro UI font NEEXISTUJE žádný token, kterým by se to dalo přebít. Jediná cesta je vlastní
// global — náš `owner` je pozdější, takže vyhrává.
//
// Velikost písma se tu záměrně nenastavuje: tu řeší uuGds přes `Uu5Elements.Text`
// (design/ux-design-system.md, 2.1). Global drží jen rodinu, barvy a reset.
Config.Css.injectGlobal({
  html: {
    fontFamily: theme.font.body,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
  body: {
    margin: 0,
    backgroundColor: theme.color.bg,
    color: theme.color.fg,
  },
  "*, *::before, *::after": { boxSizing: "border-box" },
  // Kotvy (#program, #tabulky…) nesmí skončit pod sticky lištou.
  ":target": { scrollMarginBlockStart: theme.anchorOffset },
});

// Přebarvení uu5 komponent na klubovou červenou. Z hexu si GDS odvodí všech 17 odstínů
// včetně hover stavů, takže se `colorScheme="primary"` chová jako klubová barva všude —
// v tlačítkách, chipech i modálech.
//
// MUSÍ být před prvním renderem: `setMeaningColor` mutuje modulový stav a NENÍ reaktivní,
// takže už vyrenderované komponenty by barvu nepřepočítaly.
Uu5Elements.UuGds.setMeaningColor("primary", theme.color.clubRed);

createRoot(document.getElementById("root")).render(<App />);
