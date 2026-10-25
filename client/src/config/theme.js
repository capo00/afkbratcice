// Designové tokeny odečtené z předlohy — u každé hodnoty je její oklch originál
// a role v design/ux-design-system.md, sekce 1–3.
//
// Tohle je JEDINÉ místo, kde smí být hex. Když se v JSX objeví "#...", je to chyba.
//
// **Velikost písma tu schválně není žádná.** Každý stupeň sazby je token z uuGds a bere se
// přes `Uu5Elements.Text` (category/segment/type), který spočítá `fontSize`, `lineHeight`
// i `fontWeight`. Kdyby si theme drželo vlastní škálu, měl by web dvě různé sazby — jednu
// svoji a jednu uvnitř uu5 komponent — a mobilní stupně (`smallScreen`) by přestaly platit.
// Viz design/ux-design-system.md, 2.1.

// Dvě palety se stejnými rolemi. Tmavá je předloha webu (oklch originál u každé hodnoty),
// světlá je schválená 2026-10-25 (canvas „AFK Bratčice – světlý režim“, kontrasty WCAG AA
// tamtéž). Klubová červená a text na ní jsou v obou stejné.
//
// Destruktivní barva tu **není**: je to `colorScheme="negative"` z uuGds, kterou
// tools/theme-setup.js přemapuje na oranžovou z GDS (klubová červená a červená chyba by
// splývaly; rozhodl Caio 2026-10-25).
const palette = {
  dark: {
    // Nikde není čistá černá ani bílá; všechno je posunuté do teplé (hue 25–30).
    bg: "#070404", // oklch(11.5% .006 25) — základní podklad stránky
    card: "#120D0C", // oklch(16.5% .009 25) — podklad karet
    muted: "#1D1716", // oklch(21% .01 25) — jemné plochy, neaktivní chip
    accent: "#2A1B19", // oklch(24% .025 27) — zvýrazněný řádek tabulky (vlastní tým)
    border: "#2C2423", // oklch(27% .012 25) — rámečky karet, oddělovače
    input: "#362E2D", // oklch(31% .012 25)
    fg: "#F3EFED", // oklch(95.5% .005 60) — základní text
    mutedFg: "#99908E", // oklch(66% .012 30) — sekundární text, perex, popisky
    clubRed: "#D01319", // oklch(54.5% .215 27.56) — CTA, eyebrow, aktivní nav, skóre
    clubRedBright: "#F92725", // oklch(63% .24 28) — hover, CTA pruh
    onRed: "#FEF7F2", // oklch(98% .01 60) — text na červené
  },
  light: {
    bg: "#FAF6F4",
    card: "#FFFCFA",
    muted: "#F1EAE7",
    accent: "#FBE3DF",
    border: "#E3D8D5",
    input: "#C9BCB8",
    fg: "#1C1312",
    mutedFg: "#6B5E5B",
    clubRed: "#D01319",
    clubRedBright: "#F92725",
    onRed: "#FEF7F2",
  },
};

// Komponenty berou barvy jako CSS proměnné, ne hexy: režim se tak přepne jedním atributem
// na <html> bez jediného překreslení Reactu, a tmavá plocha uprostřed světlé stránky (hero,
// červený pruh) si proměnné jen přenastaví pro svůj podstrom (`darkScope`). Hodnoty proměnných
// zakládá tools/theme-setup.js. Hex z palety je potřeba jen tam, kde CSS nestačí
// (`setMeaningColor`, `setBackground`).
const VAR_PREFIX = "--afk-";
const color = Object.fromEntries(Object.keys(palette.dark).map((key) => [key, `var(${VAR_PREFIX}${key})`]));

/** `{ "--afk-bg": "#070404", … }` -- deklarace proměnných jedné palety pro `Css.css`/`injectGlobal`. */
function paletteVars(mode) {
  return Object.fromEntries(Object.entries(palette[mode]).map(([key, value]) => [VAR_PREFIX + key, value]));
}

// Podstrom, který je tmavý v obou režimech (hero, červená sekce): přenastaví proměnné na
// tmavou paletu. `Css.css({ ...darkScope })`.
const darkScope = paletteVars("dark");

// Bebas Neue je úzký velkopísmenný grotesk — sportovní charakter předlohy stojí na něm.
// Barlow je nízkokontrastní grotesk, drží text klidný.
//
// Fallbacky jsou naschvál konkrétní: než doraz í woff2 soubory do public/assets/fonts/,
// jede web na nich a nesmí spadnout na patkové výchozí písmo prohlížeče.
const font = {
  display: '"Bebas Neue", Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  body: '"Barlow", system-ui, -apple-system, "Segoe UI", sans-serif',
};

// Co uuGds NEMÁ jako token a co si tedy theme drží: fontFamily, letterSpacing,
// textTransform a — u rolí sázených Bebasem — fontWeight.
//
// Bebas Neue existuje jen v jedné váze (400). GDS chce u `hero`/`h5` váhu 700, takže bez
// explicitního přepsání by prohlížeč tučnost **nasyntetizoval** a písmo by ztloustlo
// a rozmazalo se. Velikost se nepřepisuje nikdy — jen tyhle tři vlastnosti se přimíchávají
// ke stylu, který spočítal `Uu5Elements.Text`.
const typography = {
  display: {
    fontFamily: font.display,
    fontWeight: 400,
    letterSpacing: "0.04em", // Bebas bez prostrkání "slepí"
    textTransform: "uppercase",
  },
  body: {
    fontFamily: font.body,
  },
  // Malý prostrkaný červený štítek nad nadpisem sekce (PROGRAM, NOVINKY Z KLUBU, …).
  // Nejlevnější a nejvýraznější prvek rytmu celé stránky — nevynechávat.
  eyebrow: {
    fontFamily: font.body,
    fontWeight: 700,
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: color.clubRed,
  },
};

export default {
  palette,
  color,
  paletteVars,
  darkScope,
  font,
  typography,

  radius: 8,
  maxWidth: 1152,
  gutter: { xs: 16, s: 24 },

  // Vertikální padding sekce. Předloha má 64 px konstantně, bez nárůstu na širokém
  // desktopu — rytmus drží spíš střídání podkladů než výška mezer.
  sectionPad: 64,

  // Výška lišty z caio-ui (56) + prostor, aby kotva nekončila těsně pod ní.
  topHeight: 56,
  anchorOffset: 80,
};
