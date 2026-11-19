# Release candidate

## Přidáno
- Menu Klub v pořadí Zajímavosti, Historie, Týmové fotky, Hymna, Výbor (dříve „Výbor AFK“). Zajímavosti jsou v sitemapě.

## Opraveno
-

## Breaking
- Novinky na webu nejsou: z menu, úvodu a patičky zmizely Aktuality, routy `/novinky` a `/novinka` vrací 404, sitemapa články nevypisuje a `/rss` vrací 410. Články zůstávají v administraci.
- Fotogalerie na webu zatím není: zmizela z patičky a sitemapy, `/fotogalerie` vede dočasně (302) na úvod.
- Staré adresy z v0 `/novinka-<n>`, `/home-<n>` a `/fotogalerie-<n>` vedou natrvalo (301) na úvod.
