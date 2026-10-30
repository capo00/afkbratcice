// Veřejný web nesmí mít mezi statickými závislostmi index.js knihovny administrace (vzor
// z caio_propertyman `lazy-libs.test.js`): SystemJS index.js spustí až po stažení všech jeho
// statických importů, takže každá z nich brzdí první vykreslení webu.
//
//   admin/**           -- vlastní UVE (admin/index.html, admin.js); web na ni smí vést jen
//                         dynamickým `import()` (dlaždice zápasu líně načítá modál výsledku)
//   caio-ui            -- web bere caio-ui z kořenového barrelu `caio-ui`: s `sideEffects: false`
//                         bundler vezme jen to, co web použije, takže `Crud` (tabulky, Monaco)
//                         ani `UiEcc` (rich text) do index.js nepřijdou; `caio-ui/src/...` jen
//                         u čistých modulů bez uu5, které čte i node
//   těžké knihovny     -- tabulky, editor kódu, ořez obrázků a rich text jen v administraci
//
// Test čte zdrojáky, ne build: chyba se ukáže hned u importu, ne až v System.register.
// Tranzitivní závislosti knihoven nevidí; že lehké cesty caio-ui nevedou k těžkým knihovnám,
// hlídá caio-ui sám (`src/light-paths.test.js`, bod 14 úklidu caio stacku).
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkLazyImports } from "caio-devkit/test";

const SRC = path.dirname(fileURLToPath(import.meta.url));

test("web loads admin and heavy libraries lazily and caio-ui only from its barrel", () => {
  assert.deepEqual(
    checkLazyImports({
      srcDir: SRC,
      heavy: [/^(uu5tilesg02|uu5codekitg01|uu5imagingg01|uu5richtextg01|uu5g05-forms)/],
      // admin/** is its own UVE (admin/index.html); the web may lead there only by import()
      separate: [{ dir: "admin/", dynamic: true }],
      // caio-ui by its barrel (tree-shaken, caio-ui `sideEffects: false`), deep only for pure modules
      allow: {
        "caio-ui": [
          "caio-ui",
          // Theme data only (no uu5), read by config/theme.js.
          "caio-ui/src/caio-ui-app/theme.js",
        ],
      },
    }),
    [],
  );
});
