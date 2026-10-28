// Světlý / tmavý režim (vzor z caio-apps `client/src/color-mode.js`), společný pro web
// i administraci -- jedna origin, jedna volba.
//
// Výchozí je režim systému (rozhodl Caio 2026-10-25); přepínač v liště volbu uloží a ta pak
// platí, dokud ji nezmění. Barvy webu jsou CSS proměnné (config/theme.js), takže přepnutí je
// jen atribut `<html data-color-mode>`; proměnné pro oba režimy zakládá tools/theme-setup.js.
//
// uu5 komponentám řekne, na čem stojí, uu5g05 `AppBackgroundProvider` (je v
// `UiApp.SpaProvider`): při startu přečte barvu pozadí `body`, tady se pak přepíná přes
// `setBackground`. Barvu `body` napoprvé nastaví CSS v index.html -- podle systému, nebo
// podle uložené volby, kterou tam inline skript zapíše do `<html data-color-mode>` ještě před
// vykreslením, aby boot screen neproblikl v barvě systému.
//
// STORAGE_KEY MUSÍ sedět s inline skriptem v client/index.html a src/admin/index.html.
// Přihlašovací stránka otevřená bez appky (odkaz z e-mailu) čte od caio-ui 0.4.6 a caio-devkit
// 0.4.6 `<prefix úložiště = jméno balíčku klienta>.colorMode`, proto ten tvar klíče.
import { useAppBackground, useEffect } from "uu5g05";
import Config from "../config/config.js";

// Přesně `process.env.NAME`, viz tools/admin-hint.js.
function readName() {
  try {
    return process.env.NAME ?? "app";
  } catch {
    return "app";
  }
}
const STORAGE_KEY = `${readName()}.colorMode`;
const DARK_QUERY = "(prefers-color-scheme: dark)";
const BACKGROUND_COLOR = { light: Config.theme.palette.light.bg, dark: Config.theme.palette.dark.bg };

function getSavedMode() {
  try {
    const mode = localStorage.getItem(STORAGE_KEY);
    return mode === "light" || mode === "dark" ? mode : null;
  } catch {
    return null;
  }
}

/** Volba platná v TOMHLE panelu: atribut na <html>, ne storage (ten může změnit jiný panel). */
function getActiveMode() {
  const mode = document.documentElement.dataset.colorMode;
  return mode === "light" || mode === "dark" ? mode : null;
}

function saveMode(mode) {
  document.documentElement.dataset.colorMode = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Bez úložiště (anonymní okno, zakázaná data webu) přepínač platí do zavření stránky.
  }
}

/**
 * Položka menu lišty, která přepne režim. Ikona ukazuje režim, do kterého se přepne. Jen
 * ikona, v liště i na telefonu (`collapsed: "never"`, rozhodl Caio 2026-10-25).
 *
 * @param lsi `{ toDark, toLight }` -- popisky položky (tooltip a přístupný název).
 */
function useColorModeItem(lsi) {
  const { background, setBackground } = useAppBackground();
  const dark = background === "dark";

  // Dokud si uživatel nevybral, sleduje stránka systém i za běhu. Rozhoduje atribut na <html>,
  // ne storage: CSS proměnné se řídí atributem, a kdyby volbu mezitím uložil jiný panel,
  // proměnné by se přepnuly podle systému, ale uu5 kontext ne.
  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY);
    if (!query) return undefined;
    const onChange = (e) => {
      if (!getActiveMode()) setBackground({ backgroundColor: BACKGROUND_COLOR[e.matches ? "dark" : "light"] });
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [setBackground]);

  // Přepnutí v jiném panelu (web a administrace) platí hned i tady.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      const mode = getSavedMode();
      if (!mode) return;
      document.documentElement.dataset.colorMode = mode;
      setBackground({ backgroundColor: BACKGROUND_COLOR[mode] });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setBackground]);

  const label = dark ? lsi.toLight : lsi.toDark;
  return {
    icon: dark ? "uugdsstencil-weather-sun" : "uugdsstencil-weather-moon",
    tooltip: label,
    collapsed: "never",
    elementAttrs: { "aria-label": label },
    significance: "subdued",
    colorScheme: "building",
    onClick: () => {
      const next = dark ? "light" : "dark";
      saveMode(next);
      setBackground({ backgroundColor: BACKGROUND_COLOR[next] });
    },
  };
}

export { useColorModeItem, STORAGE_KEY };
export default useColorModeItem;
