# Release candidate

## Přidáno
- Klub → Zajímavosti (`/zajimavosti`, zatím muži A): bilance, doma a venku, forma a série, rekordy, poločasy a obraty, Klub 100, nejlepší střelci, králové střelců po sezónách, „S ním vyhráváme“, brankáři a karty za celou historii. Počítá je jeden use case `stats/getHighlights` s paměťovou cache po kategoriích (zneplatní ji zápis zápasu, nejvýš 10 minut).
- Server píše do dokumentu titulek, popis a obrázek každé stránky (náhled sdíleného odkazu na Facebooku a WhatsAppu) a neexistující stránka vrací 404 (caio-server 0.7.0, `seo.document`).

## Opraveno
- Správce týmu vidí v administraci jen své týmy (zápasy, hráči, výbor) a nemá u cizích řádků akce, které by server odmítl.
- Poločas nesmí být vyšší než konečné skóre a v základu je nejvýš 11 hráčů jednoho týmu.
- Odjezd na zápas se ve formuláři vybírá jen jako čas v den zápasu; odjezd po výkopu server odmítne.
- Přepínač v zápasech mužstva a další ruční prvky jsou komponenty uu5; jméno osoby a ročník se skládají na jednom místě.

## Breaking
- `match.departureTime` je ISO datum a čas v den zápasu (dřív „HH:MM:SS“); `match/create`/`update` přijímají jen ISO. Po nasazení spusť migraci `npm run migrate:departure-time -- --env .env` (nejdřív bez `--commit`) a ručně oprav odjezd 3. 6. 2023 Křesetice – AFK (12:45 je po výkopu 10:30).
