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
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkLazyImports } from "caio-devkit/test";

const SRC = path.dirname(fileURLToPath(import.meta.url));

test("web loads admin and heavy libraries lazily and caio-ui module by module", () => {
  assert.deepEqual(
    checkLazyImports({
      srcDir: SRC,
      heavy: [/^(uu5tilesg02|uu5codekitg01|uu5imagingg01|uu5richtextg01|uu5g05-forms)/],
      // admin/** is its own UVE (admin/index.html); the web may lead there only by import()
      separate: [{ dir: "admin/", dynamic: true }],
      // the only caio-ui modules the web may take (tools/caio-ui.js), never the barrel
      allow: {
        "caio-ui": [
          "caio-ui/src/caio-ui-app",
          "caio-ui/src/caio-ui-auth/session.jsx",
          "caio-ui/src/caio-ui-auth/profile.js",
          "caio-ui/src/caio-ui-elements/call.js",
          "caio-ui/src/caio-ui-elements/image.jsx",
        ],
      },
    }),
    [],
  );
});
