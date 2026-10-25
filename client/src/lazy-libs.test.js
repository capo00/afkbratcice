// Veřejný web nesmí mít mezi statickými závislostmi index.js knihovny administrace (vzor
// z caio_propertyman `lazy-libs.test.js`): SystemJS index.js spustí až po stažení všech jeho
// statických importů, takže každá z nich brzdí první vykreslení webu.
//
//   admin/**           -- vlastní UVE (admin/index.html, admin.js); web na ni smí vést jen
//                         dynamickým `import()` (dlaždice zápasu líně načítá modál výsledku)
//   caio-ui (barrel)   -- web bere caio-ui po modulech přes tools/caio-ui.js
//   těžké knihovny     -- tabulky, editor kódu, ořez obrázků a rich text jen v administraci
//
// Test čte zdrojáky, ne build: chyba se ukáže hned u importu, ne až v System.register.
// Tranzitivní závislosti knihoven nevidí -- že `caio-ui-app` táhne `uu5g05-forms`, je bod 14
// úklidu caio stacku.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const HEAVY_LIB = /^(uu5tilesg02|uu5codekitg01|uu5imagingg01|uu5richtextg01|uu5g05-forms)/;

const isAdmin = (file) => file.startsWith("admin/");

function listSources(dir = SRC) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSources(full);
    if (!/\.(jsx?|mjs)$/.test(entry.name) || entry.name.endsWith(".test.js")) return [];
    return [path.relative(SRC, full).replaceAll(path.sep, "/")];
  });
}

/**
 * Specifikátory statických importů a reexportů (`import x from "…"`, `import "…"`,
 * `export … from "…"`), ne `import()`.
 */
function staticImports(code) {
  return [...code.matchAll(/^\s*(?:import|export)\s+(?:[^;'"]*?\s+from\s+)?["']([^"']+)["']/gm)].map(
    (match) => match[1],
  );
}

// Z caio-ui smí web jen tyhle moduly (tools/caio-ui.js); cokoli jiného, i hlubší cesta
// k barrelu (`caio-ui/src/index.js`) nebo k `caio-ui-elements` jako celku, je chyba.
const ALLOWED_CAIO_UI = [
  "caio-ui/src/caio-ui-app",
  "caio-ui/src/caio-ui-auth/session.jsx",
  "caio-ui/src/caio-ui-auth/profile.js",
  "caio-ui/src/caio-ui-elements/call.js",
  "caio-ui/src/caio-ui-elements/image.jsx",
];

const webSources = listSources().filter((file) => !isAdmin(file));
const importsByFile = Object.fromEntries(
  webSources.map((file) => [file, staticImports(readFileSync(path.join(SRC, file), "utf8"))]),
);

test("web staticky neimportuje těžké knihovny administrace", () => {
  for (const [file, specifiers] of Object.entries(importsByFile)) {
    const heavy = specifiers.filter((specifier) => HEAVY_LIB.test(specifier));
    assert.deepEqual(heavy, [], `${file} staticky importuje ${heavy.join(", ")}`);
  }
});

test("web bere caio-ui po modulech, ne z barrelu", () => {
  for (const [file, specifiers] of Object.entries(importsByFile)) {
    for (const specifier of specifiers.filter((s) => s === "caio-ui" || s.startsWith("caio-ui/"))) {
      assert.ok(ALLOWED_CAIO_UI.includes(specifier), `${file} importuje ${specifier} -- použij tools/caio-ui.js`);
    }
  }
});

test("na administraci nevede z webu statický import", () => {
  for (const [file, specifiers] of Object.entries(importsByFile)) {
    for (const specifier of specifiers) {
      if (!specifier.startsWith(".")) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      assert.ok(!isAdmin(target), `${file} staticky importuje ${target} -- jen přes import()`);
    }
  }
});

test("test opravdu něco čte", () => {
  assert.ok(webSources.includes("app.jsx") && webSources.includes("tools/caio-ui.js"));
  assert.ok(listSources().some(isAdmin), "admin/** nenalezen -- změnila se struktura?");
});
