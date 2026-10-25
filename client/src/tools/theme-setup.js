import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import "../fonts.css";

const { theme } = Config;

/**
 * Globální styly a klubová barva. Volá se jednou před prvním renderem z obou vstupů (web
 * `main.jsx`, admin `admin/index.jsx`), ať se nemůžou rozejít.
 */
export function setupTheme() {
  // uu5g05 injektuje globální pravidlo `html { font-family: Roboto, ClearSans, sans-serif }`
  // a pro UI font NEEXISTUJE žádný token, kterým by se to dalo přebít. Jediná cesta je vlastní
  // global — náš `owner` je pozdější, takže vyhrává.
  //
  // Velikost písma se tu záměrně nenastavuje: tu řeší uuGds přes `Uu5Elements.Text`
  // (design/ux-design-system.md, 2.1). Global drží jen rodinu, barvy a reset.
  Config.Css.injectGlobal({
    // Barvy webu jsou CSS proměnné (config/theme.js). Světlá paleta je základ, tmavá platí
    // podle systému, nebo podle uložené volby z přepínače (`<html data-color-mode>`,
    // tools/color-mode.js). Stejné pravidlo pro boot screen opisuje index.html.
    ":root": theme.paletteVars("light"),
    "@media (prefers-color-scheme: dark)": {
      ":root:not([data-color-mode='light'])": theme.paletteVars("dark"),
    },
    ":root[data-color-mode='dark']": theme.paletteVars("dark"),
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
  Uu5Elements.UuGds.setMeaningColor("primary", theme.palette.dark.clubRed);

  // Destruktivní akce a chyby jsou oranžové, ne červené: červená je klubová barva a mazání by
  // vypadalo jako běžné CTA (rozhodl Caio 2026-10-25). Oranžová je z uuGds (warning), ne
  // vlastní hex, a přemapuje se celý význam `negative`, takže zoranžoví i koš v tabulkách
  // caio-ui a chyby ve formulářích.
  const orange = Uu5Elements.UuGds.getValue(["ColorPalette", "meaning", "warning", "main"]);
  if (orange) Uu5Elements.UuGds.setMeaningColor("negative", orange);
}

export default setupTheme;
