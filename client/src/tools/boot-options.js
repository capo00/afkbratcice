// Volby boot screenu (caio-ui `UiApp.renderApp`): písma první obrazovky, na která boot screen čeká,
// než se pustí (nejvýš 1,5 s po vykreslení stránky). Web i administrace (main.jsx, admin/index.jsx).
// Text s diakritikou, ať se stáhne i podmnožina latin-ext (`unicode-range` ve fonts.css).
export const BOOT_OPTIONS = {
  fontList: ['400 1em "Bebas Neue"', '400 1em "Barlow"', '600 1em "Barlow"', '700 1em "Barlow"'],
  fontSample: "AFK BRATČICE afk bratčice",
};
