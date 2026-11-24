import { createRoot } from "react-dom/client";
import { useEffect, useState, Utils, Environment } from "uu5g05";

// Boot screen webu vydrží až do hotové stránky (Caio 2026-11-24, návrh
// docs/proposal-section-loading.md, fáze 2 D).
//
// Boot screen (`#app-loading`, kruh s erbem) vkládá do HTML caio-devkit, a to **dovnitř**
// `<div id="root">`. `createRoot().render()` obsah `#root` při prvním commitu smaže, takže boot
// screen zmizel hned s prvním renderem -- a tím byl šedý `PageLoading` z `AppProvider` (pět
// úvodních dotazů, 1–4 s na pomalé síti) a po něm hero v náhradním písmu s lištou bez ikon.
//
// Proto se boot screen před renderem **přesune** z `#root` do `body` (je `position: fixed`
// s vlastním pozadím, vypadá stejně) a React ho jen pustí: až se routa vykreslí (`BootReady`
// v router.jsx) a dorazí písma a ikony lišty. Uzel zůstává tentýž, takže erb je už stažený --
// kopie v Reactu by ho znovu vytvořila a mohla bliknout. (Otáčení kruhu se přesunem restartuje,
// jedno cuknutí.)
//
// Web i administrace mají boot screen z devkitu a obě startují přes `renderApp` (main.jsx,
// admin/index.jsx); `BootReady` je v `Suspense` routy a v chybové obrazovce `AppError`. Když se
// boot screen nedrží (HTML bez `#app-loading`, nebo už je puštěný), je `useBootScreenActive()`
// `false` a `AppProvider` ukáže `PageLoading`. Až to bude chtít i jiná
// appka, patří to do caio-devkit (`#app-loading` vedle `#root`) a caio-ui (`BootReady`).

// Nad lištou (caio-ui `Top` ≥ 900), modaly (1000) i popovery a alerty (2000).
const Z_INDEX = 10000;
// Jak dlouho nejvýš čekat na písma a ikony po vykreslení stránky. Stahují se od startu souběžně
// s úvodními dotazy, takže obvykle dorazí dřív a čeká se ~0 ms; strop jen pro pomalou síť nebo
// soubor, který se nenačte. Čeká se jen na ně (`assetPromiseList`), ne na všechna CSS a písma
// dokumentu -- jeden rozbitý `<link>` by jinak každý start natáhl o celý strop.
const ASSET_WAIT_MS = 1500;
// Pojistka: kdyby se `BootReady` nikdy nevykreslil (neodchycená výjimka, nekonečné načítání),
// boot screen nesmí viset navždy. Pak se ukáže, co je pod ním (`PageLoading`, chybová obrazovka).
const SAFETY_MS = 20000;
// Prolnutí do stránky: krátké, stránka je pod ním už hotová (Caio 2026-11-24, dřív 200 ms).
const FADE_MS = 100;

// Písma, která první obrazovka opravdu sází (config/theme.js): Bebas na nadpisy, Barlow 400 text,
// 600 menu, 700 eyebrow a druhý řádek názvu klubu. Text s „Č“, ať se stáhne i podmnožina latin-ext
// (fonts.css dělí soubory podle unicode-range) -- jinak by „BRATČICE“ mělo jedno písmeno jiným písmem.
const FONT_LIST = ['400 1em "Bebas Neue"', '400 1em "Barlow"', '600 1em "Barlow"', '700 1em "Barlow"'];
const FONT_SAMPLE = "AFK BRATČICE afk bratčice";

// Ikony lišty: `uugds-*` (menu, přihlášení) a `uugdsstencil-weather-*` (přepínač režimu,
// caio-ui use-color-mode-item.js). uu5 `Icon` si jejich CSS přidá až při prvním vykreslení a písmo
// ikon má `font-display: block` -- do jeho stažení je lišta bez ikon. Tady se stáhnou dopředu;
// `Utils.Dom.addCss` duplicitní `<link>` nepřidá, takže pozdější `Icon` nic nestahuje znovu (jen
// si knihovnu nezapamatuje ve vlastní cache a při mountu znovu projde `<link>`y, zanedbatelné).
const ICON_LIBRARY_LIST = [
  { name: "uugds", font: "uu_gds_svgg01-icons" },
  { name: "uugdsstencil", stencil: "weather", font: "uu_gds_svgg01-weather" },
];

let state = "idle"; // "idle" (boot screen se nedrží) | "held" | "released"
let bootEl = null;
let safetyTimer = null;
// Písma a ikony první obrazovky, na které se před puštěním čeká (každý slib se splní i při chybě).
const assetPromiseList = [];
const listenerSet = new Set();

function setState(next) {
  state = next;
  listenerSet.forEach((listener) => listener());
}

function loadFont(font, text) {
  if (!document.fonts?.load) return Promise.resolve();
  return document.fonts.load(font, text).catch(() => {});
}

function preloadFonts() {
  for (const font of FONT_LIST) assetPromiseList.push(loadFont(font, FONT_SAMPLE));
}

// Dokončený `<link>` (načtený i neúspěšný) už `load`/`error` nepošle, proto i záznam v Resource Timing.
function linkDone(link) {
  if (link.sheet || performance.getEntriesByName(link.href).length) return Promise.resolve();
  return new Promise((resolve) => {
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
  });
}

function preloadIcons() {
  // `_constants.iconLibraryMap` je interní konstanta uu5g05 (čte ji tak i uu5g05-elements). Když
  // se změní, ikony se jen stáhnou až s `Icon`, jako dřív.
  try {
    const map = Environment._constants.iconLibraryMap;
    for (const { name, stencil, font } of ICON_LIBRARY_LIST) {
      const uri = stencil ? map[name]?.replace("%s", stencil) : map[name];
      if (!uri) continue;
      Utils.Dom.addCss(uri, true);
      const href = new URL(uri, document.baseURI).href;
      const link = [...document.querySelectorAll('link[rel="stylesheet"]')].find((l) => l.href === href);
      if (link) assetPromiseList.push(linkDone(link).then(() => loadFont(`1em "${font}"`)));
    }
  } catch {
    // Bez předem stažených ikon to funguje dál, jen pomaleji.
  }
}

/**
 * Před prvním renderem (`renderApp`): vytáhne boot screen z `#root`, aby ho React nesmazal, a začne
 * stahovat písma a ikony první obrazovky. Bez boot screenu v `#root` nedělá nic.
 */
export function keepBootScreen() {
  const el = document.getElementById("app-loading");
  const root = document.getElementById("root");
  if (state !== "idle" || !el || !root || el.parentElement !== root) return;

  bootEl = el;
  el.style.zIndex = String(Z_INDEX);
  document.body.appendChild(el);
  // Obsah se vykresluje pod překryvem: Tab ani čtečka se k němu nesmí dostat dřív, než je vidět,
  // a nesmí se dát odscrollovat (kolečko, klávesy). Programové scrollování (obnova pozice, kotva)
  // funguje i s `overflow: hidden`. Šířku stránky drží `scrollbar-gutter: stable`
  // (tools/theme-setup.js), takže se zamčením ani odemčením nic neposune.
  root.inert = true;
  root.setAttribute("aria-busy", "true");
  document.documentElement.style.overflow = "hidden";
  setState("held");

  preloadFonts();
  preloadIcons();
  safetyTimer = setTimeout(releaseBootScreen, SAFETY_MS);
}

function waitFor(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
}

function hide() {
  const root = document.getElementById("root");
  root.inert = false;
  root.removeAttribute("aria-busy");
  document.documentElement.style.overflow = "";

  const el = bootEl;
  bootEl = null;
  setState("released");
  if (!el) return;

  el.setAttribute("aria-hidden", "true");
  el.style.pointerEvents = "none";
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    el.remove();
    return;
  }
  el.style.transition = `opacity ${FADE_MS}ms ease-out`;
  el.style.opacity = "0";
  // Ne `transitionend`: ve skrytém tabu se nespustí.
  setTimeout(() => el.remove(), FADE_MS + 50);
}

let releasing = false;

/** Pustí boot screen, jakmile dorazí písma a ikony (nejvýš `ASSET_WAIT_MS`). Volat opakovaně je v pořádku. */
export function releaseBootScreen() {
  if (state !== "held" || releasing) return;
  releasing = true;
  clearTimeout(safetyTimer);
  waitFor(Promise.all(assetPromiseList), ASSET_WAIT_MS).then(hide, hide);
}

/** Drží se ještě boot screen? Po jeho puštění (nebo bez něj) `false`. */
export function useBootScreenActive() {
  const [active, setActive] = useState(state === "held");
  useEffect(() => {
    const listener = () => setActive(state === "held");
    listenerSet.add(listener);
    listener();
    return () => listenerSet.delete(listener);
  }, []);
  return active;
}

/**
 * Značka „stránka je vykreslená“: v `useEffect` pustí boot screen. Patří tam, kde se vykresluje
 * až obsah -- uvnitř `Suspense` routy, do chybových obrazovek. Sama nic nevykreslí.
 */
export function BootReady() {
  useEffect(() => releaseBootScreen(), []);
  return null;
}

/**
 * Start UVE (web main.jsx, admin admin/index.jsx): podrží boot screen a vykreslí appku do `#root`.
 * Chyby renderu chytá `ErrorBoundary` nad `AppProvider` (app.jsx, admin/app.jsx) a ukáže `AppError`.
 * Co projde i tou (chyba v `ErrorBoundary`, `SpaProvider`), odmontuje celou appku: boot screen pak
 * aspoň nesmí viset navždy. Vlastní handler nahrazuje výchozí hlášení Reactu, proto `reportError`.
 */
export function renderApp(element) {
  keepBootScreen();
  createRoot(document.getElementById("root"), {
    onUncaughtError(error, errorInfo) {
      releaseBootScreen();
      if (errorInfo?.componentStack) console.error("Neodchycená chyba renderu", errorInfo.componentStack);
      if (typeof window.reportError === "function") window.reportError(error);
      else console.error(error);
    },
  }).render(element);
}
