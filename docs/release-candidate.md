# Release candidate

## Přidáno
- Trenéři mužstev chodí rovnou se seznamem mužstev (`season/listCurrent`), stránka Mužstva je má od prvního vykreslení.
- Písma a React mají dlouhou cache (složky s verzí pod `assets/vendor/`, caio-server 0.8.3): opakovaná návštěva je nestahuje ani neověřuje.

## Opraveno
- Týmové fotky a karty mužstev při načítání neposkakují (CLS 0).
- Detail sezóny vykreslí kola až po tabulce, na mobilu méně blokuje stránku.

## Breaking
-
