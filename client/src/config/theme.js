// Designové tokeny odečtené z předlohy — u každé hodnoty je její oklch originál
// a role v design/ux-design-system.md, sekce 1–3.
//
// Hexy jsou jen v package.json `caio.theme` (barvy). Když se v JSX objeví "#...", je to chyba.
//
// **Velikost písma tu schválně není žádná.** Každý stupeň sazby je token z uuGds a bere se
// přes `Uu5Elements.Text` (category/segment/type), který spočítá `fontSize`, `lineHeight`
// i `fontWeight`. Kdyby si theme drželo vlastní škálu, měl by web dvě různé sazby — jednu
// svoji a jednu uvnitř uu5 komponent — a mobilní stupně (`smallScreen`) by přestaly platit.
// Viz design/ux-design-system.md, 2.1.

// Barvy: dvě palety se stejnými rolemi jsou v package.json `caio.theme` -- jediné místo, kde
// smí být hex (oklch originály a role v design/ux-design-system.md, sekce 1). Tmavá je předloha
// webu, světlá schválená 2026-10-25 (canvas „AFK Bratčice – světlý režim“). Destruktivní barva
// tu není: `meaning.negative` je tam přemapovaný na oranžovou z uuGds (rozhodl Caio 2026-10-25).
//
// Komponenty berou barvy jako CSS proměnné (`color.<role>` = `var(--afk-<role>)`): režim se
// přepne jedním atributem na <html> bez překreslení Reactu, a tmavá plocha uprostřed světlé
// stránky (hero, červený pruh) si proměnné přenastaví pro svůj podstrom (`darkScope`).
// Proměnné obou režimů vkládá do hlavičky caio-devkit, uu5 barvy (`primary`, `negative`) nastaví
// caio-ui `SpaProvider` -- obojí z `caio.theme`. Hex z palety (`palette.dark.bg`) je potřeba jen
// tam, kde CSS nestačí (lišta, kde `Top` z hexu pozná, že stojí na tmavém).
//
// Čistý modul bez uu5 (`caio-ui/src/caio-ui-app/theme.js`): čte ho i node.
import { Theme } from "caio-ui/src/caio-ui-app/theme.js";

const { palette, color, paletteVars, darkScope } = Theme;

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
