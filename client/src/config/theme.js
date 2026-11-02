// Designové tokeny odečtené z předlohy — role v design/ux-design-system.md, sekce 1–3.
//
// Hexy jsou jen v caio.config.js `theme` (barvy), písma a rozměry v client/client.config.js
// `app`. Když se v JSX objeví "#...", je to chyba.
//
// **Velikost písma tu schválně není žádná.** Každý stupeň sazby je token z uuGds a bere se
// přes `Uu5Elements.Text` (category/segment/type), který spočítá `fontSize`, `lineHeight`
// i `fontWeight`. Kdyby si theme drželo vlastní škálu, měl by web dvě různé sazby — jednu
// svoji a jednu uvnitř uu5 komponent — a mobilní stupně (`smallScreen`) by přestaly platit.
// Viz design/ux-design-system.md, 2.1.

// Barvy: dvě palety se stejnými rolemi jsou v caio.config.js `theme` -- jediné místo, kde smí být
// hex (oklch originály a role v design/ux-design-system.md, sekce 1). Tmavá je předloha webu,
// světlá schválená 2026-10-25 (canvas „AFK Bratčice – světlý režim“). Destruktivní barva tu není:
// `meaning.negative` je tam přemapovaný na oranžovou z uuGds (rozhodl Caio 2026-10-25).
//
// Komponenty berou barvy jako CSS proměnné (`color.<role>` = `var(--afk-<role>)`): režim se
// přepne jedním atributem na <html> bez překreslení Reactu, a tmavá plocha uprostřed světlé
// stránky (hero, červený pruh) si proměnné přenastaví pro svůj podstrom (`darkScope`).
// Proměnné obou režimů vkládá do hlavičky caio-devkit, uu5 barvy (`primary`, `negative`) nastaví
// caio-ui `SpaProvider` -- obojí z `theme`. Hex z palety (`palette.dark.bg`) je potřeba jen
// tam, kde CSS nestačí (lišta, kde `Top` z hexu pozná, že stojí na tmavém).
//
// Čistý modul bez uu5 (`caio-ui/src/caio-ui-app/theme.js`): čte ho i node.
import { Theme } from "caio-ui/src/caio-ui-app/theme.js";
import clientConfig from "../../client.config.js";

const { palette, color, paletteVars, darkScope } = Theme;
const { font, layout } = clientConfig.app;

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

  // radius, maxWidth, gutter, sectionPad, topHeight, anchorOffset (client.config.js `app.layout`).
  ...layout,
};
