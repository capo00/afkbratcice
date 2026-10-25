import { useEffect, useLayoutEffect, useState } from "uu5g05";

// Značka „v tomhle prohlížeči se někdo přihlásil do administrace“ (vzor z caio_propertyman,
// 2026-10-24, Caio).
//
// Web podle ní ukáže v liště odkaz do administrace. Je to JEN nápověda pro zobrazení, nic
// neodemyká: přístup hlídá `withRoute` guard v admin/app.jsx a server z databáze. Zapisuje ji
// admin (admin/use-admin-hint-sync.js), čte web (`useAdminHint`). Web i admin jsou jedna
// origin, takže sdílí localStorage.
//
// Klíč je `<NAME>.admin`, stejné schéma jako uložený jazyk (caio-ui `getStorageKey`).
// Storage může být zablokovaný (soukromé okno), proto všechno v try/catch.

// Přesně `process.env.NAME`: caio-devkit ho při buildu nahrazuje textově (`define`), takže
// `process.env?.NAME` ani `typeof process` by v prohlížeči nic nenašly. `try` je pro node (testy).
function readName() {
  try {
    return process.env.NAME ?? "app";
  } catch {
    return "app";
  }
}
const KEY = `${readName()}.admin`;

export function hasAdminHint() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminHint() {
  try {
    if (localStorage.getItem(KEY) !== "1") localStorage.setItem(KEY, "1");
  } catch {
    // zablokovaný storage -- odkaz se prostě neukáže
  }
}

export function clearAdminHint() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // viz setAdminHint
  }
}

/**
 * Je v prohlížeči značka? Čte se na mountu v layout effectu, tedy před prvním vykreslením,
 * takže se lišta nepřeblikne. Do té doby je `false`. Přihlášení do administrace v jiném panelu
 * se projeví hned (událost `storage` chodí jen ostatním panelům, ne tomu, který zapisuje).
 */
export function useAdminHint() {
  const [isAdmin, setIsAdmin] = useState(false);
  useLayoutEffect(() => {
    setIsAdmin(hasAdminHint());
  }, []);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY || e.key === null) setIsAdmin(hasAdminHint());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return isAdmin;
}
