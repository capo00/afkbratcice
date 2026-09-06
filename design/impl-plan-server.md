# Implementační plán — server

Datum: 2026-09-06

Jak se postaví serverová část v2 — krok za krokem, v pořadí, v jakém se to má dělat.

**Co tenhle dokument je:** postup a konkrétní rozhodnutí na úrovni „tohle napsat do tohohle
souboru“. **Co není:** zadání (to je [api.md](./api.md) a [data-model.md](./data-model.md)).
Když si plán a zadání odporují, vyhrává zadání a plán se opraví.

Frontend má vlastní plán; server jde **před ním**, protože na rozdíl od propertymanu je
tady živými daty prakticky celý web, ne jedna sekce.

> **Ověřeno proti zdrojákům `caio-architecture` 2026-09-06.** Tvrzení o chování
> `caio-server` níž jsou ze zdrojáků, ne z README — README má několik bodů neaktuálních.

---

## 0. Rozsah této dávky (rozhodnuto 2026-09-06)

Implementují se **etapy 0b–10**. Mimo rozsah:

| Mimo | Proč |
|---|---|
| **Etapa 11 — migrace** | Řeší se zvlášť; MySQL dump zatím není k dispozici |
| **Etapy 13–14 — ECC a obsah nad ním** | Design ECC se ladí samostatně |
| **`article`** | Články zatím nebudou; obsahové stránky jsou natvrdo v kódu klienta |
| **Etapa 12 — deploy** | GCP projekty existují (prod + dev), env se doplní později |

Důsledky, se kterými se počítá:

- `RSS` z etapy 10 nemá co publikovat (žádné články) — vznikne až s nimi.
- Legacy přesměrování s číselným ID (`/novinka-<n>`, `/informace-o-zapase-<n>`) potřebují
  `migration_map`, který bez migrace neexistuje. Implementují se **jen statická** pravidla,
  ID-based se doplní s migrací.
- Databáze zůstane prázdná; ověřuje se přes ručně založené záznamy a `sys/health`.

---

## 0. Mapa etap

| Etapa | Co vznikne | Hotovo, když |
|---|---|---|
| **0** | prostředí, tarbally, Mongo, GCS bucket | `npm run dev` nastartuje, `/sys/health` odpoví |
| **0b** ✅ | **reset hesla v `caio-architecture`** — hotovo 2026-09-06 | `/auth/password/reset-request` pošle e-mail, `/auth/password/reset` přepíše heslo |
| **0c** ✅ | **kolekce binárek v `caio-architecture`** — hotovo 2026-09-06 | `binary/create` odmítne neznámou kolekci, `binary/list?collection` filtruje, každá kolekce má vlastní auth |
| **1** | scaffold do existujícího repa | appka běží na `:8081`, build projde |
| **2** | kostra serveru, vlastní `sys/health` | `/sys/health` vrací `mongoConfigured: true, gcsConfigured: true` |
| **3** | `team`, `season` + binary API + **dynamické kategorie** | `season/listCurrent` vrátí kategorie klubu pro ročník |
| **4** | `match` + `stats/getTable` | tabulka souhlasí s v0 na posledních třech sezónách |
| **5** | pohledy na zápasy (filtry v `match/list`) + iCal | program víkendu jedním dotazem |
| **6** | `person`, `player`, `coach` | soupiska a realizační tým z dat |
| **7** | `match/setLineup` + statistiky hráčů | statistiky střelců a karet |
| **8** | `article` (metadata) + `appConfig` + přihlašování | redakce založí novinku s perexem a fotkou |
| **9** | `gallery` + `file` | album s náhledy, výpis ke stažení |
| **10** | `rss`, `sitemap.xml`, legacy redirecty | staré URL vedou na nové |
| **11** | migrace dat | data z MySQL i Mongo v1 v nové DB |
| **12** | deploy na GAE | běží na produkční doméně |
| **13** | **`page`** (obsahové stránky) + seed obsahu z v0 | `page/get?code=history` vrátí obsah, redakce ho změní |
| **14** | tělo článku (`article.content`), historie, týmové fotky, `/rss` | redakce publikuje novinku i s textem |
| **15** | **`pageInfo` v `caio-serveru`** | `*/list` vrací `{ itemList, pageInfo }` s `total`; `UiElements.Crud` dotáhne druhou stránku |

Kritická cesta: **0 → 1 → 2 → 3 → 4**. Etapy 5–9 jsou z větší části nezávislé a dají se
dělat paralelně.

**Etapy 0b a 0c běží mimo tohle repo** (v `caio-architecture`) a dají se dělat souběžně:
0b musí být hotová před etapou 8 (přihlašování), 0c před etapou 3 (binary API).

Jedna knihovní změna je už **hotová**: `identity/adminList` a `identity/update` měly
`auth: ["owner"]` — profil, který si žádná appka nedefinuje. Opraveno na **`authorities`**,
napevno a bez konfigurace (`caio-server/src/caio-server-auth/api/identity-api.js`,
2026-09-06). Zbývá `caio-server` přebalit a přeinstalovat.

### Obsah bez ECC (změna 2026-09-06)

Etapy 13 a 14 byly původně „port ECC modulu z v1" a „obsah nad ECC". **ECC se nepoužívá** —
článek i obsahová stránka drží obsah jako jeden `uu5String` v poli `content`, editovaný
zatím jako kód (`uu5codekitg01`). Důsledky pro plán:

| | |
|---|---|
| Etapa 13 | Není to port modulu se zámky a revizemi, ale obyčejná entita `page` (`code`, `name`, `desc`, `sectionList`) nad `Dao`/`Crud` — řádově méně práce. Sekce jsou pole objektů vložené v dokumentu, ne vlastní kolekce. Součástí je **seed obsahu z v0**, aby web nešel do provozu se šesti prázdnými stránkami. |
| Etapa 14 | `article.content` je pole, ne vazba na stránku; `article/create` nezakládá nic navíc a `article/delete` nemaže nic navíc. `/rss` má konečně co publikovat. |
| Tělo článku | `content` je **nullable**; do etapy 14 se v detailu ukazuje jen titulek, foto a perex. Metadata i seznam novinek fungují od etapy 8. |
| Migrace | Krok 9 a 11 v [migration.md](./migration.md) plní `article.content` jedním `uu5String` a `page.sectionList` jednou sekcí na blok textu — jednodušší než ECC, ale pořád až po etapě 13/14. |
| Cena | Obsah je plochý řetězec, ne `contentMap` po jazycích. Druhý jazyk = migrace jednoho pole uvnitř sekce. Až vznikne ECC, převod je rozpad `sectionList` na dokumenty `ecc_section`. |

---

## Etapa 0 — prostředí

**0.1 Node 24.** `app.yaml` cílí na `runtime: nodejs24`; lokálně musí být totéž
(`winget install --id OpenJS.NodeJS.LTS`). Nebrat „nejnovější“ doslova — pro Node 26 GAE
runtime neexistuje.

**0.2 Přebalit tarbally.** `caio-server`, `caio-ui` a `caio-devkit` nejsou v registry:

```bash
cd caio-architecture/caio-server  && npm install && npm run package
cd ../caio-ui                     && npm install && npm pack --pack-destination dist
cd ../caio-devkit                 && npm install && npm pack -w caio-devkit -w caio-create-app --pack-destination dist
```

Tarbally v `dist/` bývají starší než zdrojáky — přebalit vždy, ne spoléhat na to, co tam leží.

**0.3 Mongo.** Lokálně `mongodb://127.0.0.1:27017/afkbratcice`, produkce Atlas.

> **Past:** `caio-server` si k `MONGODB_URI` sám lepí `?retryWrites=true&w=majority`
> (`caio-server-dao/config/config.js`), takže **URI nesmí mít vlastní query string**.
> Atlas ho v „Connect“ dialogu dává — všechno od `?` dál umazat.

**0.4 GCS bucket.** Dva buckety, `afkbratcice-media` a `afkbratcice-media-dev`, aby lokální
vývoj nesáhl na produkční soubory. Lokální přihlášení
`gcloud auth application-default login`; na GAE se použije servisní účet instance.
Postup je v `caio-devkit/docs/how-to-set-gcs.md`.

**0.5 Google/Facebook OAuth + SMTP.** OAuth je volitelné — bez credentials se provider
nenabídne a appka běží dál. SMTP je potřeba až s resetem hesla (0b). Obojí stačí do etapy 8.

---

## Etapa 0b — reset hesla (změna v `caio-architecture`)

**Běží mimo tohle repo, hotová musí být před etapou 8.** v0 má `/zapomenute-heslo` a nová
verze o to nesmí přijít; patří to do knihovny, protože přihlašovací stránka je
`caio-ui/static/login/`, kterou do buildu kopíruje `caio-devkit`.

Rozpad je v [api.md](./api.md), sekce 2.14.1. Shrnutí:

| Kde | Co |
|---|---|
| `caio-server-auth` | `POST /auth/password/reset-request { email }` — token s 30min expirací, uložený **jako hash** u identity, odeslaný e-mailem. Odpovídá **vždy 200**, jinak z endpointu je nástroj na zjišťování registrovaných adres. |
| | `POST /auth/password/reset { token, password }` — ověří token a expiraci, přepíše bcrypt hash, token zneplatní. Chyby `caio-server-auth/{invalidToken, tokenExpired}`. |
| | `/auth/config` doplní `passwordResetEnabled` podle SMTP — stejná logika jako u OAuth providerů. |
| | nová závislost **nodemailer**, env `SMTP_*` a `MAIL_FROM`. Precedens: `caio_propertyman/server/services/email.js`. |
| `caio-ui` `static/login/` | odkaz *Zapomenuté heslo* (jen když `passwordResetEnabled`), panel se zadáním e-mailu, režim `?reset=<token>` se dvěma poli. Pořád vanilla JS. |

Pro aplikaci to pak znamená jen vyplnit SMTP v `.env`.

---

## Etapa 0c — kolekce binárek (změna v `caio-architecture`)

**Běží mimo tohle repo, hotová musí být před etapou 3.** Dnešní `BinaryStore.createApi()`
bere jednu konfiguraci auth pro všechny binárky — fotograf nahrávající do galerie by tím
pádem směl přepsat logo klubu. Návrh API je v [api.md](./api.md), sekce 2.11; rozpis
kolekcí tohoto webu v [roles.md](./roles.md), sekce 5.1.

Co se v knihovně mění:

| Kde | Co |
|---|---|
| `binary-dao.js` | nové pole `collection` (povinné) a `refId`, index `{ collection, refId }` |
| `binary-abl.js` | `create` vyžaduje `collection`; `list` filtruje podle `collection` a `refId` |
| `binary-api.js` | `createApi({ collectionMap })` — per kolekce `read`/`write`, případně jednotlivé operace; hodnota `true`, `{ profileList }`, `{ identityList }` nebo `{ authorize }` |
| | u `get`/`update`/`delete`/`deleteMany` si autorizace **načte záznam** a kolekci vezme z něj, ne z `dtoIn` |
| `caio-ui` `BinaryCrud` | musí umět kolekci předat |

Dvě věci, které je potřeba rozhodnout při implementaci:

1. **Existující záznamy nemají `collection`.** Pro afkbratcice to nevadí (databáze se plní
   migrací), ale `caio_propertyman` už binárky má — potřebuje buď backfill, nebo
   výchozí kolekci pro záznamy bez ní.
2. **`deleteMany` napříč kolekcemi.** Návrh říká „musí projít všechny, jinak nemaže nic“.
   Alternativa (smaž, co smíš) je pohodlnější, ale tiše dělá něco jiného, než uživatel
   čekal — proto ne.

---

## Etapa 1 — scaffold do existujícího repa

Repo `afkbratcice` **není prázdné** — obsahuje v1 aplikaci. To je zásadní rozdíl proti
propertymanu a musí se rozhodnout **před** scaffoldem:

> **Rozhodnutí k potvrzení:** v2 se staví do nové větve `v2` téhož repa, přičemž v1 kód
> (`client/`, `server/`, `tools/`, `main.js`) se **smaže v prvním commitu větve** a zůstává
> dostupný v historii a ve větvi `main`. Alternativa (nový repozitář) by rozbila odkazy
> a GAE projekt. `design/` a `dtb-design.png` zůstávají.

```bash
git switch -c v2
git rm -r client server tools main.js package.json app.yaml
npx --registry=https://repo.plus4u.net/repository/public-javascript/ \
    --package=../caio-architecture/caio-devkit/dist/caio-create-app-0.1.0.tgz caio-create-app
```

Odpovědi na prompty: `appName` = `afkbratcice` (z něj se odvodí `OUTPUT_NAME`),
`serverPort` = **`8081`**, `clientPort` = **`3001`** (nepoužívá se — devkit dev server
nespouští, ale ať sedí).

> **Porty musí být jiné než u propertymanu** (`8080` / `3000`), aby šly obě appky pustit
> vedle sebe. Bez toho druhý `npm run dev` spadne na `EADDRINUSE` a člověk chvíli hledá proč.
> Hodnota jde i do `.env` (`PORT=8081`).

Instalace na konci scaffoldu **selže** (`404 caio-devkit`) — balíčky nejsou v registry.
Vygenerované soubory ale vzniknou. Pak přesměrovat `caio-*` závislosti na tarbally
v root i `client/package.json` a doinstalovat.

**Hotovo, když:** `npm run dev` nastartuje, `http://localhost:8081` ukáže scaffoldovanou
appku, `npm run build` projde.

---

## Etapa 2 — kostra serveru

### 2.1 Struktura

```
server/
  index.js          App.init({ api })
  api.js            agregátor + vlastní sys/health
  config.js         AGE_MAP, POSITION_MAP, POINTS, SEASON_START_MONTH, ...
  services/
    validators.js   sdílené validační funkce
    season.js       výpočet yearFrom, kategorie klubu pro ročník
    table.js        výpočet tabulky (3/2/1/0)
    stats.js        agregace statistik hráčů
    ical.js         export rozpisu do .ics
  <entita>/
    dao.js          extends Dao, createIndexes()
    crud.js         extends Crud, doménová logika
    api.js          use casy
```

Rozdíl proti v1: **`crud.js` místo `abl.js`** — třída dědí z `Crud` z `caio-server`, který už
umí `list/get/create/createMany/update/delete/deleteMany` včetně typovaných chyb. ABL vrstva
z v1 se do něj přepíše, nekopíruje se.

### 2.2 `server/index.js`

```js
import { App } from "caio-server";
import api from "./api.js";

// publicPath se resolvuje z process.cwd() -- nepředávat.
// BinaryStore se neinicializuje, zapne se sám podle GCS_BUCKET_NAME.
App.init({ api });
```

### 2.3 `server/api.js`

Tvar je v [api.md](./api.md), sekce 3. Vlastní `sys/health` přebíjí ten vestavěný a hlásí
`mongoConfigured`, `googleAuthConfigured`, `gcsConfigured` — **hlásí konfiguraci, netestuje
spojení**, aby odpověděl i když je Mongo dole.

### 2.4 Čtyři vlastnosti frameworku, které tvarují všechen kód níž

1. **`dtoIn` u GET je query string.** Hodnota začínající `{` nebo `[` se automaticky projede
   `JSON.parse`. Čísla ale **zůstávají stringy** — `pageInfo.pageSize` přijde jako `"10"`,
   pokud se neposlalo jako JSON objekt. Validátory musí přetypovat.
2. **`validator` je prostá funkce `({ dtoIn }) => dtoIn`.** `uu_appdatatypesg02` nefunguje
   (nemá default export, `.exact()` neexistuje) — poznámka je přímo ve zdrojích knihovny.
   Validátor smí `dtoIn` normalizovat, protože se jeho návratová hodnota použije dál.
3. **`auth` má tři tvary.** `true` = přihlášený, pole profilů = alespoň jeden musí sedět,
   `async ({ dtoIn, identity, req }) => boolean` = vlastní logika (jediný způsob, jak
   autorizovat podle obsahu `dtoIn` — potřebné u „vlastní profil“).
4. **Klíč `sys` je v `Dao` rezervovaný** a `Dao.create` na něj hodí `DaoError`. Každý zápisový
   use case musí `dtoIn.sys` zahodit — nejlépe centrálně ve sdíleném validátoru.

**Hotovo, když:** `curl localhost:8081/sys/health` vrátí `mongoConfigured: true`
a `gcsConfigured: true`.

---

## Etapa 3 — `team`, `season`, binary, dynamické kategorie

### 3.1 `team`

`dao.js` s indexy `{ name, age } unique` a `{ age, name }`. `crud.js` řeší logo:
`create` nahraje binárku a uloží `logoId` + `logoUri`, `update` s `logo: null` binárku smaže,
`delete` smaže i logo. **Při selhání zápisu se nahraná binárka uklidí** (kompenzace, převzato
z v1 `team-abl.js`).

`logoUri` je denormalizace — `binary.uri` se mění při každé změně obsahu, takže `update` loga
musí `logoUri` přepsat, jinak zůstane viset staré.

### 3.2 `season` a kategorie klubu

Indexy `{ competition, yearFrom, age } unique`, `{ age, yearFrom }`, `{ teamList }`.
`services/season.js` počítá `yearFrom = měsíc < SEASON_START_MONTH ? rok - 1 : rok`.
`season/delete` odmítne smazání, když na sezónu existují zápasy
(`afkbratcice/season/hasMatches`, 400).

**Tohle je místo, kde se řeší dynamické kategorie.** Složení mužstev se mění každou sezónu
(letos Muži + Dorost + Žáci + Stará garda, za rok třeba jen Muži + Žáci, nebo starší
a mladší žáci zvlášť), takže se **nikde nevyjmenovávají**:

- `season/listCurrent?yearFrom` vrátí sezóny daného ročníku, v jejichž `teamList` je tým
  s `own: true` — jedna položka na kategorii, s `seasonId`, `age`, `competition`, `teamId`,
  `teamName` a `hasTable`.
- `season/listYears` vrátí ročníky, pro které existují data (přepínač sezóny).
- `hasTable: false` u soutěží bez tabulky (stará garda) — položka *Tabulka* se v menu
  vůbec neobjeví.
- Řazení podle `appConfig.categoryOrder`, neznámé kódy na konec.
- `appConfig.teams` a `homeAge` z v1 **zanikají** — byl to statický výčet, tedy přesně to,
  co se má měnit.

`AGE_MAP` v `server/config.js` zůstává jako číselník **všech možných** kategorií (8 hodnot);
které jsou aktivní, říkají data.

### 3.3 binary

Jen se vloží `BinaryStore.createApi({ create, update, delete })` s profily
konfigurací **kolekcí** (`sys`, `team`, `person`, `article`, `gallery`, `page`, `file`),
každá s vlastní autorizací — viz [roles.md](./roles.md), 5.1. **Vyžaduje hotovou etapu 0c.**
Aplikaci zůstává jen index `{ collection, category, date }` kvůli výpisu „Ke stažení“.

**Hotovo, když:** `season/listCurrent` vrátí pro 2026 čtyři kategorie a pro vymyšlený
ročník bez sezón prázdný seznam; `team/create` s logem uloží binárku a vrátí funkční
`logoUri`.

---

## Etapa 4 — `match` a tabulka

### 4.1 `match`

Port z v1. Indexy podle [data-model.md](./data-model.md), sekce 4 — pozor na **částečný**
unikátní index (`partialFilterExpression: { round: { $exists: true } }`), jinak dvě přátelská
utkání stejné dvojice v jedné sezóně zápis rozbijí.

- `match/list` s `teamId` hledá `$or: [{ homeTeamId }, { guestTeamId }]`.
- `departureTime` se ve veřejném `dtoOut` vrací jen roli `members` a výš — to je autorizace
  podle obsahu, takže se řeší v `crud.js`, ne v `auth`.
- `setResult` dopočítá `state: "played"` a ověří, že `penaltyWinnerTeamId` je jeden ze
  zúčastněných týmů **a** že `homeGoals === guestGoals`
  (`afkbratcice/match/invalidPenaltyWinner`).
- `createMany` pro import rozlosování z OFS.

### 4.2 `services/table.js`

Nejcitlivější kus celé serverové části — je to jediné místo, kde v1 udělal regresi proti v0.

Bodování z `config.POINTS`: výhra 3, výhra na penalty 2, prohra na penalty 1, prohra 0,
remíza bez rozstřelu 1. Do tabulky vstupují **jen zápasy s vyplněnými oběma skóre a s
vyplněným `round`** (vylučuje přátelské) — shodně s v0 `getTable.php`.

Řazení: `points` → vzájemné zápasy → `goalDifference` → `goalsFor` → název týmu.

Řádek nese navíc **formu** — posledních 5 výsledků jako `["W","D","L","W","W"]`; klient
z toho udělá kolečka ve sloupci tabulky. Je to zadarmo ze stejného průchodu daty.

> **Regresní test je součást etapy, ne dodatek.** Tabulka spočítaná z migrovaných dat se pro
> poslední tři sezóny musí shodovat s výstupem v0 `/api/getTable`. Bez toho se etapa
> nepovažuje za hotovou.

**Hotovo, když:** `stats/getTable` sedí na v0 pro tři sezóny, včetně případu s penaltami.

---

## Etapa 5 — pohledy na zápasy

Zápasy jsou nejsledovanější obsah webu, takže na ně vede víc cest než jen „zápasy týmu“.
Zdůvodnění výběru je v [frontend.md](./frontend.md), sekce 2.4.

**Žádné nové use casy — jen filtry v `match/list`.** Původní návrh měl vedle sebe
`listRound`, `listProgram` a `listHeadToHead`; všechny tři jsou ale jen jiné dotazy nad
stejnou kolekcí, takže se z nich stanou parametry:

| Parametr | Sémantika |
|---|---|
| `teamId` | tým je domácí **nebo** hostující (`$or`) |
| `teamIdList` | kterýkoli z uvedených týmů (`$in` nad oběma poli) — program víkendu |
| `opponentId` | **jen spolu s `teamId`**; zúží na dvojici, tedy H2H |
| `dateFrom` / `dateTo` | rozsah nad `time`, včetně hranic; zápas bez `time` do rozsahu nespadá |
| `order` | `"asc"` (výchozí, rozpis) nebo `"desc"` (výsledky) |

Server tak nemá use case, který by „věděl“, co je víkend nebo co je náš tým — obojí si
určuje klient (seznam vlastních týmů má ze `season/listCurrent`). Kdyby se ukázalo, že
program víkendu potřebuje víc dotazů, než je zdrávo, je to důvod přidat agregaci pak,
ne teď dopředu.

Jediný skutečný přírůstek v téhle etapě:

| Trasa | Co dělá | Poznámka |
|---|---|---|
| `GET /calendar/team-<id>.ics` | odběr rozpisu do telefonu | `services/ical.js`; vyjít z `caio_propertyman/server/services/ical-export.js` |

Program víkendu na současném webu chybí a je z celého seznamu nejužitečnější: klub má tři
až čtyři mužstva, která hrají v sobotu a v neděli na různých místech a v různé časy.
Na novém webu je to **sekce na úvodní stránce**, ne samostatná routa.

iCal je netypová trasa — use case s `method: "get"`, který si odpověď pošle sám přes `res`
a **vrátí `false`**. Hlavička `Content-Type: text/calendar; charset=utf-8`
a `Content-Disposition: inline`.

**Hotovo, když:** `match/list?teamIdList&dateFrom&dateTo` vrátí zápasy nejbližšího víkendu
za všechny kategorie, `?teamId&opponentId` vrátí vzájemné zápasy v obou orientacích,
a `.ics` se dá přidat jako odběr v telefonu se sedícími časy.

---

## Etapa 6 — `person`, `player`, `coach`

Tři nové entity, ve v1 neexistují (`player-dao.js` je prázdný soubor).

- `person` — indexy `{ surname, name }`, `{ email } sparse`, `{ identity } unique sparse`.
  **Ochrana osobních údajů:** `birthdate`, `email`, `phone` se vrací jen roli
  z množiny `CONTENT` nebo osobě samotné (`person.identity === identity.identity`).
  Filtruje `crud.js`, ne API — jinak to jde snadno obejít jiným use casem.
- `player` — `teamList[] = { id, dateFrom, dateTo }`; aktivní soupiska je
  `$elemMatch: { id: teamId, $or: [{ dateTo: null }, { dateTo: { $gte: dnes } }] }`.
- `coach` — stejná struktura, navíc `role` včetně `board` (výbor klubu, pokrývá stránku
  „Výbor AFK“ bez další entity).

`person/delete` odmítne smazání, když existuje navázaný `player` nebo `coach`.

`person/linkSelf` (automatické spárování osoby s přihlášením podle ověřeného e-mailu,
[api.md](./api.md), 2.5.1) se přidává **až v etapě 8** — dřív se nemá kdo přihlásit.

**Hotovo, když:** `player/list?teamId&active=true` vrátí soupisku s vloženými osobami
a nepřihlášenému v ní chybí kontakty.

---

## Etapa 7 — sestavy a statistiky hráčů

`match/setLineup` ověří, že hráči patří do některého z týmů zápasu. Součet `goals` vyšší než
počet gólů týmu je **varování, ne chyba** — vlastní góly.

`services/stats.js` agreguje přes `match.playerList` **aggregation pipeline**
(`$unwind: "$playerList"`), ne v paměti. `MatchDao` k tomu dostane metodu `aggregate`, kterou
základní `Dao` nemá. Ze stejné pipeline padá i „zápasy hráče“ na jeho profil.

**Hotovo, když:** `stats/listPlayerStats` vrátí starty, góly a karty odpovídající ručnímu
součtu pro jednu sezónu.

---

## Etapa 8 — `article`, `appConfig`, přihlašování

**Jen metadata článku** — `content` je zatím `null`. `article/create` ukládá titulek, perex,
autora, titulní foto, `publishTime`, `priority`, `state` a vazbu na zápas; tělo se zapíná
v etapě 14. `content` je proto **nullable** a klient musí umět článek bez těla.

`article/list` `content` **nevrací** — výpis novinek potřebuje perex, ne celé texty.

`article/delete` maže titulní fotku; nic dalšího uklízet nemusí (obsah je pole téhož
dokumentu, ne samostatná entita).

`article/list` bez `state` vrací nepřihlášeným jen `published` s `publishTime <= nyní`.
Řazení `priority` DESC, `publishTime` DESC (shodně s v0).

`app_config` je singleton; při prázdné kolekci vrací výchozí objekt (chování z v1).
Obsah je v [config.md](./config.md), sekce 6 — `categoryOrder`, `hideNamesAgeList`, `notice`
(proužek pod lištou), `contact`, `socialList`, `fileCategoryList`, `founded`.
**Žádný výčet kategorií.**

Tady je poprvé potřeba **přihlašování**: dotáhnout Google credentials, vyplnit SMTP a přiřadit
si profil `authorities` ručním zápisem do `sys_identity`. **Vyžaduje hotovou etapu 0b** — bez
resetu hesla by se šlo přihlásit, ale ne se z něj vyhrabat.

S přihlašováním přichází i **`person/linkSelf`** ([api.md](./api.md), 2.5.1): páruje osobu
s identitou podle e-mailu, ale jen když ho ověřil provider a shoduje se právě jedna osoba
bez `identity`. Nesplněná podmínka není chyba, vrací `{ linked: false }`.

---

## Etapa 9 — `gallery` a `file`

`gallery/addPhoto` přijímá **dva soubory** (plná `w1600` + náhled `w400`), protože GCS
náhledy negeneruje. Uloží obě binárky a do plné doplní `thumbBinaryId` a `thumbUri`.
`deletePhoto` maže obě, `gallery/delete` maže všechny s `refId = galleryId`.

`gallery.photoCount` a `coverThumbUri` udržuje `crud.js`.

`file/list` je vlastní filtrovaný pohled na `sys_binary` (`type: "document"`), aby veřejná
část nepotřebovala `binary/list`.

---

## Etapa 10 — RSS, sitemap, legacy redirecty

Netypové trasy se registrují jako use case s `method: "get"`, který si odpověď pošle sám přes
`res` a **vrátí `false`** — `App.init` pak nic dalšího neodesílá.

`server/legacy-redirect.js` musí být namountovaný **před** SPA fallbackem. ~90 pravidel,
číselná ID se překládají přes `migration_map` — tabulka je v [migration.md](./migration.md),
sekce 5. Nepřeložitelné ID končí na 404 s odkazem na odpovídající seznam.
`/diskuze*` vede 301 na `/home` — diskuze se ruší.

---

## Etapa 11 — migrace dat

Vlastní dokument: [migration.md](./migration.md). Pro server je podstatné, že migrace běží
**přes `crud.js` vrstvu, ne přímo do Monga** — jinak by obešla dopočty (`logoUri`,
`photoCount`, `state`) a data by nesouhlasila s tím, co produkuje API.

Tři výjimky a upřesnění:

- `sys_binary` z v1 se nedá zkopírovat — soubory se musí stáhnout z Google Drive a nahrát
  do GCS (viz [migration.md](./migration.md), krok 8).
- **Kroky 9 (články) a 11 (ECC stránky) se v téhle etapě nedělají** — ECC modul ještě
  neexistuje. Migrují se až po etapě 13; do té doby se u článků naplní jen metadata
  (titulek, perex, foto, datum, vazba na zápas) a `content` zůstane prázdné.
- ECC sekce z v1 mají plochý `uu5String`; migrace ho zabalí do `contentMap: { cs: … }`.

---

## Etapa 12 — deploy

`app.yaml` = `runtime: nodejs24`. `npm run deploy` = build + `gcloud app deploy`.
Servisní účet instance potřebuje roli **Storage Object Admin** na bucketu.
`.env` se na GAE nenasazuje — proměnné jdou přes `app.yaml` `env_variables` nebo
Secret Manager.

Pozor na `PORT`: GAE si ho nastavuje sám, `8081` platí jen lokálně.

---

## Etapa 13 — entita `page`

Obyčejná entita nad `Dao`/`Crud`: `code` (unikátní, z pevného číselníku), `name`, `desc`
(perex) a `sectionList` — **pole objektů sekcí vložené v dokumentu**, zatím s jediným klíčem
`content` (`uu5String`). Use casy `page/get|list|create|update|delete`, zápisy na `PAGES`.
Kontrakt: [api.md](./api.md), sekce 2.9.

Čtyři věci, na kterých záleží:

- **`page/get` bere `code`**, ne jen `id` — routa je `/page?code=history` a na ty kódy míří
  `server/legacy-redirect.js`. Neznámý `code` je 404 `afkbratcice/page/notFound`.
- **`code` je součást veřejného kontraktu.** Překlep v administraci = rozbité přesměrování
  ze starého webu, ne jen chybějící stránka.
- **`sectionList` se ukládá celý.** `page/update` bere pole, ne přírůstkové operace nad
  jednotlivou sekcí — stránku edituje jeden člověk v jednom modalu.
- **Seed obsahu z v0** (`tools/seed-pages.js`): historie, hymna, kontakt (včetně `<iframe>`
  mapy), výbor, tréninky, týmové fotky. Bez něj by web šel do provozu se šesti prázdnými
  stránkami.

Žádné zámky ani revize — šest stránek a jeden kronikář; osmihodinový lock by tu neřešil nic,
co se reálně děje. Sekce ale zůstávají jako objekty, aby k nim šlo přidat metadata bez
migrace a aby byl pozdější přechod na ECC rozpad pole na dokumenty `ecc_section`.

**Hotovo, když:** `page/get?code=history` vrátí naseedovaný `sectionList` a `page/update` ho
změní.

---

## Etapa 14 — tělo článku, historie, RSS

- **`article.content`** se zapne: `article/create` a `update` ho ukládají, `article/get` vrací,
  `article/list` ne. Nic se nezakládá ani neuklízí navíc — je to pole téhož dokumentu.
- **Historie** dostane časovou osu — `Uu5Bricks.VerticalTimeline` zaregistrovaná do
  `uu5String`, aby zůstala editovatelná redakcí
  (viz [frontend.md](./frontend.md), sekce 3.11.1).
- **`/rss`** — teď má co publikovat.
- **Dokončí se migrace** kroků 9 a 11.

**Hotovo, když:** redakce založí novinku s textem, ta se objeví na home i v `/rss`.

---

## Etapa 15 — `pageInfo` v `caio-serveru`

Běží mimo tohle repo. `Dao.find` vrátí `{ itemList, pageInfo: { pageIndex, pageSize, total } }`
(`total` z `countDocuments` nad stejným filtrem), `Crud.list` a use casy tvar propustí dál.

Není to kosmetika: `UiElements.Crud` volá `handlerMap.loadNext({ pageInfo: { pageIndex } })`
a `useDataList` bez `total` neví, kdy přestat — takže bez toho nejde stránkovat novinky,
dotahovat fotky v albu ani listovat administrací. Do té doby jedou seznamy na jednu dávku
`pageSize: 1000`, což pro dnešní objem stačí, ale po migraci ~2 600 fotek už ne.

**Ověřit i na `caio_propertyman`** — mění se tvar odpovědi každého seznamu na stacku.

**Hotovo, když:** `match/list` vrátí `pageInfo.total`, a tabulka v administraci si sama
řekne o druhou stránku.

---

## Rizika a jak se hlídají

| Riziko | Hlídá se |
|---|---|
| Tabulka se rozejde s v0 (bodování na penalty) | regresní test v etapě 4, tři sezóny |
| ECC modul se ukáže složitější, než vypadá | je až na konci, takže neblokuje web; cena je, že do té doby nejsou obsahové stránky ani těla článků a migrace se dělá nadvakrát |
| Reset hesla se nestihne | etapa 0b běží mimo repo souběžně; blokuje jen etapu 8 |
| Kategorie se někam propíšou natvrdo | grep na `"men"`/`"u14"` mimo `config.js` a LSI musí být prázdný |
| `logoUri`/`thumbUri` zůstanou viset na starém `uri` | každý `update` obsahu binárky přepisuje denormalizace; pokrýt testem |
| Osobní údaje uniknou veřejným API | filtruje `crud.js`, ne jednotlivé use casy; test na `person/list` bez přihlášení |
| Migrace fotek (~2 600 × 2 velikosti) spadne v půlce | idempotence přes `migration_map`, běh po dávkách s retry |
| Lokální tarbally — změna v knihovně se nepropíše | po každém `npm pack`: `rm -rf node_modules/<balíček> && npm install --no-save --force file:…tgz` |
