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
- **Proměnná prostředí `NPM_TOKEN`** — klasický GitHub PAT se scope `read:packages`

`caio-server`, `caio-ui` a `caio-devkit` se berou z GitHub Packages jako `@capo00/*`;
`.npmrc` v kořeni i v `client/` mapuje ten scope na `npm.pkg.github.com` a token si bere
z `${NPM_TOKEN}`. V `package.json` jsou pod nescopovaným jménem přes alias
(`npm:@capo00/caio-server@^0.2.0`), protože v `node_modules` musí ležet jako
`caio-server`/`caio-ui`/`caio-devkit`.

Nová verze knihovny je normální `npm install` — už žádné přebalování tarballů:

```bash
npm install                      # vezme nejnovější 0.2.x podle package.json
npm update caio-server caio-ui   # posun v rámci ^0.2.0
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

## Nasazení na Google Cloud (App Engine)

**Zatím se nedělalo** (`todo.md`, Etapa 12). GCP projekty (prod + dev) podle `todo.md`
existují, ale env i první deploy chybí — tohle je kompletní seznam, co je potřeba doplnit
a v jakém pořadí. Cíl je pořád appka v mezích Always Free vrstvy.

### 1. Jednorázově: projekt a App Engine

```bash
gcloud auth login
gcloud projects list                    # najdi ID produkčního projektu z todo.md
gcloud config set project <project-id>
gcloud app create --region=us-central1  # JEDNOU navždy -- region se pak nedá změnit
```

App Engine appku nejde založit bez propojeného billing účtu, i když se vejdeš do free
tier — *Billing → Link a billing account*, pokud ještě není.

`us-central1` není nutnost, ale zjednodušuje to krok 3 (GCS free tier drží jen na třech
US regionech) a `caio-server/docs/binary.md` doporučuje appku a bucket ve stejném regionu
kvůli latenci.

### 2. Produkční MongoDB

Lokální Mongo z vývoje nejde použít — potřeba je dosažitelná instance, typicky
[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier (M0). Postup je
[`caio-devkit/docs/mongodb-setup.md`](../caio-architecture/caio-devkit/docs/mongodb-setup.md).

> **Network Access:** App Engine standard nemá pevnou odchozí IP (dokud si nezřídíš
> Serverless VPC Connector + Cloud NAT, což něco stojí a je to navíc práce). Pro appku
> tohohle rozsahu je reálná volba `0.0.0.0/0` v Atlasu — hranici pak drží jen
> uživatelské jméno/heslo, takže silné heslo databázového uživatele není volitelné.

Connection string jde do `MONGODB_URI` v `.env` (kapitola 4).

### 3. Produkční GCS bucket

Postup je [`caio-devkit/docs/how-to-set-gcs.md`](../caio-architecture/caio-devkit/docs/how-to-set-gcs.md)
— zopakuj kroky 1–5 **pro produkční jméno** (dev bucket `afkbratcice-binary-dev` už
existuje a nesahá se na něj). V kroku 5 patří `Storage Object Admin` jen App Engine
service accountu, ne tvému osobnímu účtu. Jméno bucketu jde do `GCS_BUCKET_NAME`
(kapitola 4).

### 4. OAuth přihlášení (Google / Facebook) — volitelné

Bez tohohle appka nastartuje a nabídne jen jméno/heslo. Postup i s odkazem na
Facebook konzoli je [`caio-devkit/docs/login.md`](../caio-architecture/caio-devkit/docs/login.md).
Redirect URI musí mířit na **finální produkční URL**:

```
https://<project-id>.appspot.com/auth/google/callback
https://<project-id>.appspot.com/auth/facebook/callback
```

(nebo na vlastní doménu, viz krok 7). `GOOGLE_CLIENT_ID`/`SECRET` a
`FACEBOOK_APP_ID`/`SECRET` jdou do `.env`.

### 5. SMTP pro reset hesla — volitelné

`SMTP_HOST`, `MAIL_FROM` a `APP_URL` do `.env`. `APP_URL` musí být ta samá finální URL
jako v kroku 4 — jinak odkaz na reset hesla v e-mailu vede jinam než appka reálně běží.

### 6. Vyplnit `.env`

`.env` se **nahrává spolu se zdrojáky** (`.gcloudignore` vylučuje jen
`.env.development`) a server ho v produkci čte přímo bez `NODE_ENV=development` — žádný
Secret Manager ani `app.yaml: env_variables`, tenhle stack drží konfiguraci takhle.

```env
MONGODB_URI=...          # krok 2
GCS_BUCKET_NAME=...      # krok 3
GOOGLE_CLIENT_ID=...     # krok 4, volitelné
GOOGLE_CLIENT_SECRET=...
FACEBOOK_APP_ID=...      # krok 4, volitelné
FACEBOOK_APP_SECRET=...
SMTP_HOST=...            # krok 5, volitelné
MAIL_FROM=...
APP_URL=...
JWT_SECRET=...           # vlastní náhodný řetězec, JINÝ než v .env.development
JWT_LIFETIME=...
```

### 7. Samotný deploy

```bash
npm run deploy
```

Spustí postupně:

1. **`caio-devkit build`** — `vite build` klienta do `public/`.
2. **`gcloud app deploy`** — nahraje repo (mimo `.gcloudignore`) a appku spustí. Zeptá se
   na potvrzení (verze, region); `gcloud app deploy -q` potvrzení přeskočí.

`gcloud app deploy` sám spustí `npm install` v cloudu (Cloud Build) jen nad
`dependencies`, ne `devDependencies` — proto `caio-devkit` v deploy repu vůbec nemusí být
resolvovatelný. `caio-server` si Cloud Build stáhne z GitHub Packages; token na to
dostane z `build_env_variables: NPM_TOKEN` v `app.yaml`, který tam `caio-devkit deploy`
sám dopíše z proměnné prostředí a po doběhnutí zase odstraní. `.npmrc` proto musí jít
nahoru se zdrojáky — nepatří do `.gcloudignore`.

> **Token skončí v nahraných zdrojácích** (staging bucket, zdrojáky nasazené verze).
> Tenhle model deploye — zdrojáky nahoru, build u Googlu — jinou cestu nemá, takže to
> musí být vyhrazený PAT jen se scope `read:packages`, ne osobní token.

> **Staging bucket.** `gcloud app deploy` normálně nahrává zdrojáky do
> `staging.<project-id>.appspot.com` — ten bucket ale u novějších projektů Google
> nezakládá automaticky (GCS teď u doménově vyhlížejících jmen vyžaduje ověření
> vlastnictví domény, které u `appspot.com` nikdo mimo Google udělat nemůže). `caio-devkit
> deploy` proto místo něj používá a při první potřebě sám založí
> `<project-id>-gae-staging` — žádný ruční krok navíc není potřeba.

### 8. Po prvním deployi

```bash
curl https://<project-id>.appspot.com/sys/health   # mongoConfigured by mělo být true
```

Založ prvního správce proti **produkční** databázi (lokálně, s `MONGODB_URI` dočasně
přepsaným na produkční Atlas connection string):

```bash
MONGODB_URI=<produkční connection string> npm run seed:admin -- muj@email.cz
```

Volitelně vlastní doména místo `appspot.com` (`afkbratcice.cz`) — doména musí být napřed
ověřená v [Search Console](https://search.google.com/search-console), pak:

```bash
gcloud app domain-mappings create afkbratcice.cz
```

A stejně jako u GCS bucketu (`how-to-set-gcs.md`, krok 8) založit rozpočtový alert
(*Billing → Budgets & alerts*) jako pojistku proti překročení free tier.

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
