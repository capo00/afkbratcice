# Release candidate

## Přidáno
- Nastavení v administraci (ze stacku): odchozí pošta, registrace a záložka Klub -- upozornění, kontakt včetně vlastní mapy, sociální sítě, pořadí kategorií, skrytá jména a rok založení.
- Konfigurace ve třech vrstvách: `.env.example` a `npm run check-env`, `caio.config.js`, `server/server.config.js`, `client/client.config.js`.
- Konfigurace klubu je v Nastavení (`sys_settings.app`), ne v kolekci `afk_config`: před nasazením `npm run migrate:settings` proti produkční databázi (README, *Vydání s konfigurací ve třech vrstvách*). `appConfig/update` zanikl, `appConfig/get` zůstává na jedno vydání jako alias.
- `JWT_LIFETIME` z `.env` je v `server/server.config.js`; `client/.env.development` zanikl (`CLIENT_PORT` v kořenovém `.env.development`).

## Opraveno
- Uložení konfigurace už nesmaže vlastní mapu (`contact.mapUrl`), kterou formulář neukazoval.
- Barva lišty nainstalované appky je klubová červená `#D01319` (dřív `#8b0000`).

## Breaking
-
