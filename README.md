# AFK Bratčice — web klubu (v2)

Návrh je v [`design/`](./design/); tenhle soubor říká, jak appku spustit.

Stack: Node 24 + Express 5 přes [`caio-server`](../caio-architecture/caio-server),
Vite 6 + React + `uu5g05` přes [`caio-ui`](../caio-architecture/caio-ui),
běhové příkazy z [`caio-devkit`](../caio-architecture/caio-devkit).

## Stav

**Co běží:** serverové sportovní jádro (týmy, sezóny, zápasy, osoby, hráči, trenéři),
tabulka a statistiky, galerie, konfigurace, iCal a sitemap — a nad tím veřejná část webu:
home, mužstva, soupiska, zápasy, tabulka, statistiky, detail zápasu, kolo, profil hráče
a fotogalerie s lightboxem.

**Co chybí:** obsah (`page`, `article`, `/rss`), „Ke stažení", celá administrace, migrace
a nasazení. Kompletní seznam i s pořadím je v **[todo.md](./todo.md)**.

Jedna věc, kterou je dobré vědět hned: `GCS_BUCKET_NAME` není vyplněné, takže se
`binary/*` nezaregistrují a **upload souborů nebyl nikdy otestovaný**.

## Rozjezd

```bash
npm install
cd client && npm install && cd ..
npm run dev          # server i klient, http://localhost:8081
```

Porty jsou **8081 / 3001** schválně jiné než u `caio_propertyman` (8080/3000), aby šly
obě appky pustit vedle sebe.

### Prerekvizity

- **Node 24** (`app.yaml` cílí na `runtime: nodejs24`)
- **MongoDB** — lokálně `mongodb://127.0.0.1:27017/afkbratcice`
- **Přístup k registry `repo.plus4u.net`** kvůli `uu5*` balíčkům

`caio-server`, `caio-ui` a `caio-devkit` nejsou v registry a berou se jako lokální
tarbally. Po změně v knihovně **nestačí `npm install`** — verze se nemění, takže npm
vezme balíček z cache:

```bash
cd ../caio-architecture/caio-server && npm run package
cd ../../afkbratcice && rm -rf node_modules/caio-server \
  && npm install --no-save --force file:../caio-architecture/caio-server/dist/caio-server-0.1.0.tgz
```

## Konfigurace

`.env.development` se načte při `NODE_ENV=development`, jinak `.env`.
Žádná proměnná není z pohledu startu povinná — server nastartuje i s prázdným souborem
a chybějící schopnosti se prostě nenabídnou. Co která dělá:
[design/config.md](./design/config.md), sekce 5.

Prakticky potřebné: `MONGODB_URI` a `GCS_BUCKET_NAME` (bez něj se `binary/*` nezapnou).
Pro přihlášení `GOOGLE_CLIENT_ID`/`SECRET` a `FACEBOOK_APP_ID`/`SECRET`, pro reset hesla
`SMTP_HOST`, `MAIL_FROM` a `APP_URL`.

### První správce

Profil `authorities` nejde nastavit přes API — identity smí editovat právě jen ta role,
takže první musí vzniknout mimo něj:

```bash
npm run seed:admin -- muj@email.cz
```

Identita dostane kód `1-1-1`. Heslo se nenastavuje; přihlas se přes Google, nebo si ho
nastav přes *Zapomenuté heslo* na `/login.html`.

> **Změna role platí okamžitě.** Server čte `profileList` z databáze při každém requestu,
> ne z JWT; v otevřeném prohlížeči stačí načíst stránku znovu.

## Ověření

```bash
npm run smoke        # proti běžícímu serveru
```

49 kontrol přes reálné API a Mongo: bodování tabulky (3/2/1/0 včetně penalt), dynamické
kategorie, role s rozsahem (`teamEditor`), ochrana osobních údajů, pohledy na zápasy,
legacy přesměrování, iCal a sitemap. Data se jmenují `SMOKE` a skript je po sobě uklidí.

## Struktura serveru

```
server/
  index.js          App.init({ api, middlewareList })
  api.js            agregátor use casů + vlastní sys/health
  config.js         číselníky, role, kolekce binárek, bodování
  legacy-redirect.js  přesměrování starých URL (před SPA fallbackem)
  services/         validators, authorize, season, table, stats, ical
  <entita>/         dao.js (indexy, dotazy) + crud.js (logika) + api.js (use casy)
  seo/api.js        sitemap.xml, /calendar/team*.ics
```

Vzor je `caio_propertyman`; oproti v1 je `crud.js` místo `abl.js`, protože dědí z `Crud`
v `caio-server`, který CRUD i typované chyby už umí.

## Co se cestou změnilo v `caio-architecture`

Serverová část si vyžádala pět úprav v knihovnách — všechny jsou tam zdokumentované:

| Změna | Proč |
|---|---|
| `identity/adminList` a `update` z profilu `owner` na **`authorities`** | `owner` si nedefinovala žádná appka |
| **Reset hesla** (`/auth/password/reset-request`, `/reset`) + odkaz na přihlašovací stránce | v0 ho měl a nová verze o něj nesmí přijít |
| **Kolekce binárek** (`BinaryStore.createApi({ collectionMap })`) | jedna role na všechny soubory nestačí: fotograf nemá přepsat logo klubu |
| `Authentication.resolveIdentity` na všech use casech | veřejný endpoint dřív vůbec nevěděl, kdo se ptá — a `departureTime` pro členy to potřebuje |
| `Dao` vrací `id` jako **string** | vracel `ObjectId`, což přes JSON vypadá stejně, ale v procesu tiše rozbíjelo každé porovnání s id od klienta |
| `App.init({ middlewareList })` | legacy přesměrování musí běžet před SPA fallbackem a appka tam neměla jak nic zaregistrovat |
