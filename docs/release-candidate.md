# Release candidate

## Přidáno
- Nastavení v administraci (ze stacku): odchozí pošta, registrace a záložka Klub -- upozornění, kontakt včetně vlastní mapy, sociální sítě, pořadí kategorií, skrytá jména a rok založení.
- Konfigurace ve třech vrstvách: `.env.example` a `npm run check-env`, `caio.config.js`, `server/server.config.js`, `client/client.config.js`.
- Konfigurace klubu je v Nastavení (`sys_settings.app`), ne v kolekci `afk_config`: před nasazením `npm run migrate:settings` proti produkční databázi (README, *Vydání s konfigurací ve třech vrstvách*). `appConfig/update` zanikl, `appConfig/get` zůstává na jedno vydání jako alias.
- `JWT_LIFETIME` z `.env` je v `server/server.config.js`; `client/.env.development` zanikl (`CLIENT_PORT` v kořenovém `.env.development`).
- Jedna dlaždice zápasu všude (seznamy, detail ve velké variantě, novinka): odehraný zápas ukazuje i poločas a vítěze penalt, výsledek jde upravit všude, kde na to má přihlášený práva.

## Opraveno
- Uložení konfigurace už nesmaže vlastní mapu (`contact.mapUrl`), kterou formulář neukazoval.
- Barva lišty nainstalované appky je klubová červená `#D01319` (dřív `#8b0000`).
- Vítěz penaltového rozstřelu se zadává jen v sezóně s penaltami a jen při remíze; server ho jinak odmítne.
- `article/get` už nepouští veřejnosti čas odjezdu u zápasu (`departureTime`).

## Breaking
-
