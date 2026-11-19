# Release candidate

## Přidáno
- Menu Klub v pořadí Zajímavosti, Historie, Týmové fotky, Hymna, Výbor (dříve „Výbor AFK“). Zajímavosti jsou v sitemapě.
- Historie klubu doplněná o roky 2013–2025 (25 milníků podle článků webu a výsledků zápasů). Každý milník má datum v přesnosti, jakou zdroj zná, titulek, shrnutí a rozbalovací podrobnosti (údaje, odkazy mezi milníky); ikona podle typu události. Kotva `/historie#milnik-<id>` milník otevře.

## Opraveno
- caio-server 0.8.0: `robots.txt` už nezakazuje API (`/match/`, `/stats/`, ...), takže Google vykreslí stránky i s výsledky a tabulkami. API, administrace a `/login.html` nesou hlavičku `X-Robots-Tag: noindex`, administrace tak nemůže skončit v indexu ani jako holá adresa.

## Breaking
- Novinky na webu nejsou: z menu, úvodu a patičky zmizely Aktuality, routy `/novinky` a `/novinka` vrací 404, sitemapa články nevypisuje a `/rss` vrací 410. Články zůstávají v administraci.
- Fotogalerie na webu zatím není: zmizela z patičky a sitemapy, `/fotogalerie` vede dočasně (302) na úvod.
- Staré adresy z v0 `/novinka-<n>`, `/home-<n>` a `/fotogalerie-<n>` vedou natrvalo (301) na úvod.
