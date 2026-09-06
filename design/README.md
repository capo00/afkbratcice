# AFK Bratčice – Design nové verze webu

Datum: 2026-08-20 · aktualizováno 2026-09-06

Tento adresář obsahuje kompletní návrh nové (třetí) generace webu fotbalového klubu
AFK Bratčice. **Jde pouze o návrh – žádný kód se v rámci tohoto designu neimplementuje.**

| Dokument | Obsah |
|---|---|
| [README.md](./README.md) | Přehled, rozhodnutí, architektura, role, fáze, rizika |
| [data-model.md](./data-model.md) | MongoDB kolekce, pole, indexy, vazby, odchylky od ER diagramu |
| [api.md](./api.md) | Kompletní API kontrakt (use case, metoda, dtoIn, dtoOut, autorizace) |
| [frontend.md](./frontend.md) | Routy, obrazovky, komponenty, znovupoužití `caio-ui` |
| [component-tree.md](./component-tree.md) | Rozpad obrazovek na komponenty — co je uu5, co `caio-ui`, co píšeme sami |
| [roles.md](./roles.md) | Role, jejich rozsah a tabulka use casů — **zdroj pravdy pro autorizaci** |
| [ux-design-system.md](./ux-design-system.md) | Barvy, typografie, rytmus a překlad předlohy do uu5 |
| [config.md](./config.md) | Co je v `theme.js`, `config.js`, LSI, `.env` a `app_config` |
| [impl-plan-server.md](./impl-plan-server.md) | Postup stavby serveru po etapách |
| [migration.md](./migration.md) | Migrace dat z MySQL (PHP) i z Mongo (v1), přesměrování URL, nasazení |
| [mockups/](./mockups/) | Screenshoty Lovable předlohy (desktop 1536 px + mobil 390 px) |

Zdrojový ER diagram: [`../dtb-design.png`](../dtb-design.png)

> **Aktualizace 2026-09-05.** Návrh vznikl 2026-08-20 proti tehdejšímu stavu knihoven.
> Od té doby se `caio-server`, `caio-ui` a `caio-devkit` posunuly (jeden balíček místo pěti,
> Google **Cloud Storage** místo Google Drive, hotové `binary/*` a `identity/*` API, uu5 přes
> `Uu5Loader`) a vznikla referenční appka [`caio_propertyman`](../../caio_propertyman), podle
> které se řídí struktura projektu, LSI a designové tokeny. Dokumenty jsou přepsané do tohoto
> stavu; sekce [7. Předpoklady a rizika](#7-předpoklady-a-rizika) drží záznam o tom, co se
> vyřešilo a co zbývá.

---

## 1. Kontext

Existují dvě předchozí implementace:

### 1.1 `afk/www` – produkční PHP web (v0)

- PHP 5 + `mysql_*` (deprecated), MySQL, ruční SQL v šablonách, žádné vrstvení.
- Routing přes `.htaccess` RewriteRule (~90 pravidel), URL v češtině.
- Tabulky: `hrac`, `tym`, `zapas`, `ucast`, `post`, `clanek`, `soubor`, `serial`,
  `pripona`, `fotogalerie`, `trener`, `diskuze`, `prijem`, `pokuta`, `vydaj`, `zakazip`.
- Fotky leží na disku v `galerie/<datum>/`, reporty v `reporty/`, soubory v `soubory/`.
- Obsahuje i JSON API (`/api/<uc>` → `cmd/controller/*.php`) – `getTable`, `getMatches`,
  `getPlayers`, `getRounds`, `getArticles`, `getFiles`, `getNews`, `getComments`.
- **Funkční logika, kterou je nutné zachovat** (viz `cmd/controller/getTable.php`):
  tabulka počítá body systémem **3 / 2 / 1 / 0** – výhra 3, výhra na penalty 2,
  prohra na penalty 1, prohra 0. Sloupec `zapas.penalty` drží `id` týmu, který
  penaltový rozstřel vyhrál.

### 1.2 `git/afkbratcice` – uu5 aplikace (v1)

- Node.js + Express 4 + MongoDB (native driver), CommonJS, deploy na Google App Engine.
- Vlastní interní knihovny `server/libs/oc_*` a `client/.../libs/oc_cli-*`, které se
  mezitím osamostatnily do repozitářů **`caio-server`** a **`caio-ui`**.
- Hotové entity: `team`, `season`, `match`, `binary`, `ecc_page`, `ecc_section`, `app`.
- Chybí: `person`, `player`, `coach`, `article`, `gallery`, statistiky, veřejné
  obsahové stránky. `server/dao/player-dao.js` existuje, ale je prázdný (bez ABL i API).
- Tabulka ve v1 (`server/abl/match-abl.js`) **neumí bodování na penalty** – počítá jen
  3/1/0. Oproti v0 jde o regresi, kterou nová verze opravuje.
- Klientská část staví na uu5g05 + webpack (`uuappdevkit`), obsahuje navíc pluginy
  `caio-tournament`, `caio-lenavisage`, `the-chase`.

### 1.3 Zdroj obsahu

**Obsah nové verze se bere z běžícího `afkbratcice.cz` (v0).** Kontrola provedená
5. 9. 2026 dala inventuru rout a obsahu; výsledek je v [frontend.md](./frontend.md),
sekce 2.3. Co web dnes reálně nese:

- novinky se stránkováním (poslední z 16. 8. 2026), detaily zápasů, soupisky se
  statistikami hráčů, tabulky tří soutěží, 19 fotoalb, ~40 PDF rozpisů ke stažení,
- obsahové stránky: historie od roku 1932, hymna „Traverza“, kontakt s GPS, Výbor AFK
  (7 lidí včetně telefonů a e-mailů), týmové fotky od roku 1943 se jmennými popisky,
- na každé stránce pravý panel: upozornění, poslední/následující zápas s odpočtem
  a zkrácená tabulka.

Dvě věci k vyřazení: **diskuze** má poslední příspěvek z roku 2017 a je zaspamovaná
(potvrzuje rozhodnutí v sekci 2), **klubová kasa** je mimo rozsah.

> Server v0 po sérii rychlých požadavků ukončil spojení (`ERR_CONNECTION_CLOSED`) —
> pravděpodobně tabulka `zakazip`. Při migraci a při dalším procházení číst pomalu
> a s odstupem, jinak se IP zablokuje.

Reálná data z v0 mají přednost před tím, co si vymyslela předloha: Lovable prototyp má
například ve výboru jiná jména a role než skutečný web.

### 1.4 Předloha vzhledu (Lovable)

Vizuální předloha vznikla jako prototyp v Lovable („AFK Bratčice Hub“) — černo-červený
klubový web s hero fotkou, programem zápasů, výsledky, aktualitami, přepínatelnou tabulkou,
časovou osou historie, přehledem mužstev, fotogalerií s lightboxem a kontaktem s výborem.

**Předloha je inspirace, ne zadání ani zdroj kódu.** Je to Tailwind/shadcn appka; nová verze
z ní přebírá barvy, typografii a rozvržení, ale implementuje se **výhradně přes `uu5g05`
a `caio-ui`**. Screenshoty a odečtené hodnoty jsou v [ux-design-system.md](./ux-design-system.md)
a [mockups/](./mockups/).

Nová verze (v2) přebírá datový model a business logiku z v1, doplňuje chybějící
entity z ER diagramu a přechází na aktuální stack `caio-server` + `caio-ui` + `caio-devkit`.

---

## 2. Rozhodnutí

| Téma | Rozhodnutí |
|---|---|
| Architektura | **Nová aplikace scaffoldovaná přes `caio-create-app`**, běhové příkazy `caio-devkit start/build/deploy`. Repozitář `afkbratcice` (v1) zůstává jako legacy reference. |
| Referenční appka | [`caio_propertyman`](../../caio_propertyman) – struktura složek, LSI, `config/theme.js`, tvar `server/api.js` a `sys/health` se přebírají odtud. |
| **Implementace UI** | **Výhradně `uu5g05` + `caio-ui`.** Vzhled se ladí **propsy** komponent, ne přestylováním; `className` nad uu5 komponentou jen tam, kde prop neexistuje, a vždy se zápisem do `docs/decisions.md`. Žádný Tailwind, žádné kopírování kódu z předlohy. |
| **uu5g04** | **Zakázané.** Nic se na g04 nenavrhuje ani neimplementuje — ani jako varianta. Chybí-li komponenta, hledá se v uu5g05 řadě (`uu5g05-elements`, `Uu5Bricks`, `uu5tilesg02`, `uu5g05-forms`), jinak se napíše vlastní nad uu5g05. |
| Rozsah | Jádro dle ER diagramu + **fotogalerie** + **statické obsahové stránky** (historie, hymna, kontakt, výbor). Klubová kasa (pokladna, pokuty, příjmy/výdaje) a diskuze **nejsou** v rozsahu. |
| **Obsah článku** | `article.sectionList` – pole objektů sekcí, zatím s jediným klíčem `content` (`uu5String`). Objekt, ne holý string: nadpis, kotva nebo varianta podkladu se pak přidají bez migrace. Perex je samostatné pole `desc`. |
| **Obsah stránky** | **Natvrdo v kódu** (`client/src/content/pages.js`) jako `uu5String`; entita `page` **se nedělá** a počká na ECC (rozhodnuto 2026-09-06). Obsahová stránka je přesně to, co ECC řeší — stavět kvůli mezidobí druhou polovinu téhož by znamenalo napsat editaci dvakrát. Text se do té doby mění v kódu a nasazuje s buildem. |
| **Vykreslení obsahu** | `Uu5.Content` z `uu5g05` — na rozdíl od `Utils.Uu5String.toChildren()` řeší nesting level a `fallback`, takže nezmapovaná značka nezhodí celou stránku. |
| **Adresy rout** | **České** (`/historie`, `/muzstva`, `/fotogalerie`, `/zapas`, …). Je to web českého klubu a hlavně jsou tím shodné s v0, takže osm starých URL sedí **bez jediného přesměrování**. |
| **Editace obsahu** | Zatím **jako kód, ne WYSIWYG** – `uu5codekitg01`. Rich-text přijde s ECC a bude to výměna jednoho formulářového vstupu. |
| Design ECC | **Ladí se samostatně** (od 2026-09-06). Články na něj nečekají; obsahové stránky ano. Až vznikne, migrace je rozpad `sectionList` na dokumenty `ecc_section` a přesun textu z `content/pages.js` do databáze — obojí beze změny tvaru obsahu. |
| Kontakt | **Není obsahová stránka, ale data** — routa `/kontakt` skládá adresu, e-mail a telefon z `appConfig.contact` a mapu z `gps`. Mít je natvrdo a zároveň v konfiguraci by znamenalo dvě pravdy. |
| Soubory ke stažení | Binární kolekce **`download`**, čtení veřejné. |
| **Perex** | V celém modelu je to samostatné pole `desc` (`page.desc`, `team.desc`, `season.desc`), nikdy první sekce ani popisek fotky. |
| Migrace | **Mimo rozsah této dávky.** Neimplementuje se; `migration.md` zůstává jako návrh na později. |
| Pořadí kategorií | `["men","u18","u16","u14","u12","u10","u6","old"]` — od nejstarších, stará garda je výjimka na konci. |
| Skrytí jmen | `hideNamesAgeList = ["u14","u12","u10","u6"]` — u dorostu (`u18`, `u16`) se jména ukazují. **Filtruje server, ne klient** (2026-09-06): klientský příznak by jména dětí nechal v odpovědi API. |
| Loga týmů | `team.logoUri` drží URI z `sys_binary` (kolekce `team`); když chybí, klient sáhne po klubovém erbu. |
| Týmová fotka a perex | `team.desc` (perex), `team.photoUri` + `team.photoDesc` (fotka a popisek pod ní) — 2026-09-06; karta mužstva v přehledu je bez nich neúplná. Jen u vlastních týmů. |
| Stránkování | `dtoOut` seznamů vrací `pageInfo` včetně `total` — **doplní se do `caio-server`** (2026-09-06), protože bez něj `UiElements.Crud` neumí načíst další stránku. |
| Správce | Identita **`1-1-1`** s profilem `authorities`; e-mail se plní z env při seedu. |
| Jazyk UI | **Zatím jen čeština.** Texty povinně v `client/src/lsi/cs.json` přes `importLsi`; `en.json` se nezakládá. Zapnutí dalšího jazyka = nový `<lang>.json` + řádek v `IMPORT_BY_LANGUAGE` + kód v `languageList`, ne refaktor. |
| Jazyk obsahu (ECC) | Redakce plní **jen `cs`**, ale sekce ukládá `contentMap: { cs: uu5String }` – druhý jazyk nebude znamenat migraci dat. |
| Kategorie mužstev | **Dynamické podle sezóny**, nikde se nevyjmenovávají. Zdroj pravdy je kolekce `season`; `appConfig` drží jen pořadí v menu a výjimky. |
| Velikosti písma | **Vždy z uuGds** přes `Uu5Elements.Text`. V `theme.js` není jediné `fontSize`; GDS řeší i mobilní stupně. |
| Boční panel | **Nebude.** Dvousloupcový vzor z v0 se ruší, obsah se přesouvá do sekcí a do proužku pod lištou. |
| Autentizace | `Authentication` z `caio-server` – Google OAuth 2.0, Facebook a e-mail/heslo, JWT v cookie, přihlašovací stránka `/login.html` z devkitu. |
| Úložiště souborů | `BinaryStore` z `caio-server` – **Google Cloud Storage** + metadata v Mongo. (Dřívější návrh počítal s Google Drive; knihovna se mezitím přepsala na GCS.) |
| Náhledy obrázků | **Generují se na klientu před uploadem** (`uu5imagingg01-tools`), GCS je neumí. Viz sekce 3.1. |

---

## 3. Stack

**Server**

- Node.js 24, ESM (`"type": "module"`)
- Express 5 přes `caio-server` – `App.init({ api })`
- MongoDB (driver 7) přes `Dao`, business logika přes `Crud`, chyby přes `Error`
- Autentizace: `Authentication` (`caio-server`); binární soubory: `BinaryStore` (`caio-server`)
- Validace `dtoIn`: **prosté funkce** `({ dtoIn }) => dtoIn`, viz [api.md](./api.md), sekce 1

**Klient**

- Vite 6 + React **18.3.1** (ne 19 – to je verze, na které jede referenční appka),
  `uu5g05` / `uu5g05-elements` / `uu5g05-forms` / `uu5tilesg02*`
- uu5 knihovny se **nebundlují** – resolvuje je za běhu `uu5loaderg01`; zařizuje
  `createViteConfig()` z `caio-devkit/vite`
- `caio-ui` – `UiApp` (SpaProvider, Spa, Page, useTop, withRoute), `UiAuth` (SessionProvider,
  useSession, Unauthenticated, Unauthorized, IdentityItem), `UiElements` (Call, CrudContext,
  Crud, BinaryProvider, BinaryCrud, FormFile, Image). `UiEcc` **se nepoužívá** — viz sekce 2
- `uu5richtextg01-elements` + `uu5codekitg01` (editor ECC sekcí), `uu5imagingg01-tools`
  (zmenšení a konverze obrázků na klientu před uploadem)

**Provoz**

- Google App Engine (`app.yaml` = `runtime: nodejs24`), MongoDB Atlas,
  Google Cloud Storage bucket pro binární data.
- V devu **není Vite dev server ani HMR**: `caio-devkit start` pustí `nodemon` nad `server/`
  a `vite build --watch` do `public/`; všechno jede přes serverový port (**8081** — jiný než propertyman), tedy
  same-origin bez proxy. Po uložení je potřeba refresh.

### 3.1 Náhledy obrázků (změna proti původnímu návrhu)

Google Drive uměl `thumbnail?id=…&sz=w400` a původní návrh na tom stavěl. **Google Cloud
Storage nic takového nemá** – vrací se přesně to, co se nahrálo. Důsledky:

- Klient obrázek **před uploadem zmenší a převede na WebP**
  (`Uu5ImagingTools.Adjustment.resizeMax` + `changeType`, stejně jako to dělá `BinaryCrud`).
- Kde je potřeba náhled i originál (fotogalerie), nahrávají se **dvě binárky**: náhled
  `w400` a plná verze `w1600`; album si drží obojí (viz [data-model.md](./data-model.md), sekce 9).
- Kde stačí jedna velikost (logo `w400`, portrét `w600`, titulní foto článku `w1200`),
  nahrává se jen ta.
- `binary.uri` je veřejná adresa objektu v bucketu a **vrací se i v `list`/`get`** –
  klient si nic neskládá.

---

## 4. Struktura projektu

Kopíruje `caio_propertyman`; konvenci adresářů vyžaduje `caio-devkit`
(`server/index.js`, `client/`, `public/`, `.env`).

```
afkbratcice/
  app.yaml                       # runtime: nodejs24
  package.json                   # scripts: dev|build|deploy -> caio-devkit
  .env / .env.development
  server/
    index.js                     # App.init({ api }) – publicPath se NEPŘEDÁVÁ
    api.js                       # agregátor všech *api.js + vlastní sys/health
    config.js                    # AGE_MAP, POSITION_MAP, výchozí hodnoty
    team/{dao,crud,api}.js
    season/{dao,crud,api}.js
    match/{dao,crud,api}.js
    person/{dao,crud,api}.js
    player/{dao,crud,api}.js
    coach/{dao,crud,api}.js
    article/{dao,crud,api}.js
    gallery/{dao,crud,api}.js
    file/api.js                  # veřejný pohled nad sys_binary, bez vlastní kolekce
    ecc/                         # dočasně v aplikaci, cíl = modul caio-server-ecc
      page/{dao,crud,api}.js
      section/{dao,crud,api}.js
    stats/api.js                 # tabulka a statistiky hráčů (bez vlastní kolekce)
    app-config/{dao,crud,api}.js # singleton konfigurace aplikace
    services/                    # sdílené výpočty (tabulka, agregace statistik)
  client/
    vite.config.js               # createViteConfig() z caio-devkit/vite
    index.html
    public/
      favicon.ico
      assets/meta/               # PWA: manifest.json, icon-192/512, maskable, apple-touch, og-image
      assets/fonts/              # Bebas Neue + Barlow (.woff2)
    src/
      main.jsx, app.jsx          # UiApp.SpaProvider + UiApp.Spa (top/footer/main) + Router
      router.jsx
      config/config.js           # TAG, Css, AGE_MAP, POSITION_MAP
      config/theme.js            # JEDINÉ místo s hexy a velikostmi písma
      lsi/{import-lsi.js,cs.json,en.json}
      components/layout/         # section, heading, eyebrow, card, footer
      components/               # match-tile, standings-table, team-logo, photo-grid, ...
      routes/                   # veřejné obrazovky
      admin/                    # správcovské obrazovky (CRUD)
  public/                        # build output klienta (deploy i dev)
  tools/migrate/                 # jednorázové migrační skripty
  design/                        # tento návrh
```

Konvence pojmenování souborů je kebab-case. Soubory s JSX mají příponu **`.jsx`**
(Vite/esbuild neparsuje JSX v `.js`) – týká se to i `caio-ui`, kde je to už opravené.

**Žádný text nepatří natvrdo do komponenty** – všechny jdou do `client/src/lsi/*.json`
a čtou se přes `<Lsi import={importLsi} path={[...]} />` nebo `useLsi(importLsi, [...])`.

---

## 5. Moduly

| Modul | Veřejná část | Správa | Zdroj v0/v1 |
|---|---|---|---|
| Týmy | soupiska, logo, kategorie | CRUD + logo | v1 `team` |
| Sezóny | výběr sezóny, účastníci soutěže | CRUD | v1 `season` |
| Zápasy | rozpis, výsledky, detail zápasu, odjezd | CRUD + hromadné vytvoření + zápis sestavy | v1 `match` + v0 `ucast` |
| Tabulka | tabulka soutěže dle sezóny/kategorie | – (počítáno) | v0 `getTable.php`, v1 `match-abl` |
| Osoby | – | CRUD | v0 `hrac` |
| Hráči | profil, statistiky, soupiska | CRUD, přiřazení do týmů | v0 `hrac`, ve v1 chybí |
| Trenéři | realizační tým, výbor | CRUD | v0 `trener` |
| Články | seznam novinek, detail, vazba na zápas | CRUD; obsah `uu5String` v `content` | v0 `clanek` |
| Fotogalerie | alba, lightbox | CRUD alb + hromadný upload | v0 `fotogalerie` |
| Soubory | ke stažení dle kategorie | vlastní `Crud` nad `BinaryProvider` (kolekce `file`) | v0 `soubor` + `serial` |
| Obsahové stránky | historie, hymna, kontakt, výbor, tréninky, týmové fotky | CRUD `page`; obsah `uu5String` v `content` | v0 statické PHP |
| Identity | přihlášení, profil | správa profilů (`identity/adminList`, `identity/update`) | v1 `oc_app-auth` |

---

## 6. Role a autorizace

Role vychází z `identity.profileList` (JWT cookie) – shodně s v1.
**Kompletní model, tabulka use casů a rozsahové role jsou v [roles.md](./roles.md);**
tady je jen přehled.

| Role | Kdo to je | Co spravuje |
|---|---|---|
| **Guest** | návštěvník | – (veškeré veřejné `GET`) |
| `members` | hráč, člen klubu | vlastní profil, interní údaje zápasu (odjezd, nominace) |
| `teamEditor:<teamId>` | trenér / vedoucí jednoho mužstva | soupiska, realizační tým a zápasy **svého** týmu |
| `matchEditor` | zapisovatel výsledků | zápasy, výsledky a sestavy všech týmů |
| `newsEditor` | autor novinek | články včetně jejich obsahu |
| `galleryEditor` | klubový fotograf | fotogalerie a alba |
| `contentEditor` | kronikář / tajemník | obsahové stránky a soubory ke stažení |
| `operatives` | správce obsahu | všechno výše + osoby, týmy, sezóny |
| `authorities` | správce webu | navíc identity, přidělování rolí, konfigurace |

Pravidla:

- Autorizace se deklaruje v definici use casu (`auth: true` / `auth: ["operatives"]`),
  vynucuje ji `caio-server-app/services/command.js`. `auth` může být i funkce
  `async ({ dtoIn, identity, req }) => boolean` – **jediná cesta, jak rozhodnout podle
  obsahu `dtoIn`**, což potřebuje `teamEditor`.
- Role se **nedědí** – v seznamu `auth` se uvádějí všechny, které mají projít. Proto jsou
  v `server/config.js` pojmenované množiny (`CONTENT`, `MATCH`, `NEWS`, …).
- **`teamEditor` má rozsah zapsaný v názvu profilu** (`teamEditor:<teamId>`), protože
  `profileList` je plochý seznam stringů. Detail a jeho úskalí: [roles.md](./roles.md), sekce 3.
- `profileList` je součástí JWT → **změna profilu se projeví až po novém přihlášení**.
  UI na to musí uživatele upozornit.
- Na klientu se stejná pravidla duplikují přes `UiApp.withRoute(Component, { profileList })`
  a podmíněné `actionList` – jde o UX, ne o bezpečnostní hranici.

> **Vyřešeno 2026-09-06:** `identity/adminList` a `identity/update` měly v knihovně natvrdo
> profil `owner`; opraveno na **`authorities`**, a to napevno bez konfigurace — správa
> identit vypadá stejně ve všech projektech na tomhle stacku.

> **`teamEditor` a klientský guard — vyřešeno 2026-09-06 v `caio-ui`.** `withRoute` bere
> rozsahové profily jako `"teamEditor:*"` (prefix + neprázdný rozsah) a `UiAuth.getScopeList()`
> vrátí obrazovce konkrétní `teamId`. Patří to do knihovny, ne do appky: „správce jednoho
> záznamu" potká každý projekt na tomhle stacku. Viz [frontend.md](./frontend.md), sekce 2.2.

---

## 7. Předpoklady a rizika

### 7.1 Vyřešeno od 2026-08-20

| # | Původní problém | Stav |
|---|---|---|
| 1 | `caio-ui` nejde naimportovat do Vite (JSX v `.js`) | **Vyřešeno 2026-08-24.** 23 zdrojů přejmenováno na `.jsx`; root import `caio-ui` funguje, protože `caio-devkit` uu5 nebundluje a načítá je přes `uu5loaderg01`. |
| 3 | `BinaryStore` neregistruje API | **Vyřešeno.** `BinaryStore.createApi({ list, get, create, update, delete, deleteMany })` vrací šest use casů; každý má vlastní konfiguraci auth (`{ profileList }` nebo `{ authorize }`). Aplikace si je jen vloží do `api`. |
| 4 | `Binary.uri` se neukládá | **Vyřešeno.** `uri` je uložené v `sys_binary` a vrací se i v `list`/`get`. `update` obsahu vždy vytvoří nový objekt → nové `uri`, takže cache nikdy neservíruje starou verzi. |
| 5 | Cesta ke klíči servisního účtu natvrdo | **Vyřešeno.** GCS jede na Application Default Credentials; lokálně `gcloud auth application-default login`, na GAE servisní účet instance. Volitelně `GOOGLE_APPLICATION_CREDENTIALS`. Žádný `server/system-identity.json`. |
| 6 | Výchozí `publicPath` ukazuje vedle | **Vyřešeno.** `publicPath` se resolvuje z `process.cwd()`; do `App.init` se **nepředává** (viz `caio_propertyman/server/index.js`). |
| 7 | Start vyžaduje `GOOGLE_CLIENT_ID` a `MONGODB_URI` | **Vyřešeno.** Obojí je nepovinné. Bez Google credentials se strategie neregistruje a provider se prostě nenabídne; bez `MONGODB_URI` server nastartuje a DB operace selžou s čitelnou hláškou. |
| 8 | Chybí API pro správu `profileList` | **Vyřešeno.** `Authentication.createApi()` dodává `identity/search\|list\|get\|adminList\|update`. Profil opraven z `owner` na **`authorities`** (2026-09-06, `caio-server`) – identity smí editovat jen ta role. |
| 10 | Google Drive kvóty u hromadného uploadu | **Neplatí.** GCS nemá Drive limity na zápis. Zbývá jen praktické: migrace ~2 600 fotek se pouští po dávkách s retry, a limit `BINARY_MAX_FILE_SIZE_MB` (výchozí 25) / `BINARY_MAX_FILES` (20) platí na request. |
| 2 | `caio-server` nemá ECC modul (page/section) | **Neplatí od 2026-09-06** – ECC se nepoužívá. Článek i stránka drží obsah jako jeden `uu5String`, `UiEcc` se nevolá. Viz sekce 2 a [api.md](./api.md), 2.9. |
| 3′ | `BinaryStore` nemá kolekce | **Vyřešeno 2026-09-06** v `caio-server`: `createApi({ collectionMap })` s autorizací per kolekce, `binary/list` filtruje `collection`/`refId`. `UiElements.BinaryCrud` bere povinnou prop `collection`. |
| 12 | `UiEcc.Page` bere jen `{ id }`, ne `code` | **Neplatí** – `page/get` bere `code` přímo, žádný překlad `code → id`. |
| 17 | Chybí reset hesla | **Vyřešeno 2026-09-06** v `caio-server-auth` (hashovaný jednorázový token, 30 min, nodemailer) i na přihlašovací stránce `caio-ui` (režimy `forgot` / `reset`). Appce zbývá vyplnit `SMTP_HOST`, `MAIL_FROM`, `APP_URL`. |
| 19 | `UiEcc` neumí předat jazyk | **Neplatí** – ECC se nepoužívá. Cena za to je, že `content` je plochý `uu5String`: druhý jazyk bude migrace jednoho pole, ne jen doplnění kódu. |

### 7.2 Otevřené

| # | Problém | Dopad | Navržené řešení |
|---|---|---|---|
| 9 | **Seznamy nevrací `pageInfo`.** `Dao.find` vrací holé pole, `Crud.list` z něj dělá `{ itemList }` — nikde v `caio-serveru` `pageInfo` zpátky nechodí. `UiElements.Crud` přitom volá `handlerMap.loadNext({ pageInfo: { pageIndex } })` a `useDataList` bez `total` neví, kdy přestat. | Nejde stránkovat nic — ani novinky, ani fotky v albu, ani administrace. Do té doby jedou seznamy na jednu dávku `pageSize: 1000`. | **Změna v `caio-server`** (rozhodnuto 2026-09-06): `Dao.find` vrátí `{ itemList, pageInfo: { pageIndex, pageSize, total } }` a `Crud.list` i use casy tvar propustí. Ověřit i na `caio_propertyman`. Detail: [api.md](./api.md), 1.0.1. |
| 21 | ~~`match/list` nevrací týmy~~ | – | **Vyřešeno 2026-09-06**: mapa týmů v `app-contextu` (`team/list` jednou při startu SPA) — levnější než denormalizace názvů do každého zápasu. Viz [frontend.md](./frontend.md), sekce 4. |
| 22 | ~~`match/list` nemá filtr `playerId`~~ | – | **Vyřešeno 2026-09-06**: filtr je v `match/dao.listByFilter` i ve validátoru, index tam byl od začátku. |
| 23 | ~~`season/list` nemá `idList`~~ | – | **Vyřešeno 2026-09-06**: profil hráče podle něj dopojmenovává sezóny ze statistik. |
| 24 | `UiApp.withRoute` neuměl rozsahovou roli | **Vyřešeno 2026-09-06 v `caio-ui`**: `profileList: ["teamEditor:*"]` matchuje prefix s neprázdným rozsahem, `UiAuth.getScopeList(identity, "teamEditor")` vrátí konkrétní id. |
| 25 | **`file/list` filtruje podle `category`, kterou nikdo nezapisuje.** `UiElements.BinaryCrud` je záměrně nerozšiřitelná přes props. | Stránka „Ke stažení“ by byla jeden nesekcovaný seznam. | `admin/files` si složí vlastní `Crud` konfiguraci nad `BinaryProvider` s poli `category` a `date`. Viz [frontend.md](./frontend.md), 6.1. |
| 11 | ~~`uu_appdatatypesg02` nefunguje~~ – **omyl, opraveno 2026-09-06.** Balíček (`0.2.1`) funguje, jen nemá default export a metody se jmenují `shape()` / `array()`, ne `.exact()` / `.arrayOf()`. Poznámka v `caio-server` je v tomhle zavádějící. | – | Validovat přes pojmenované importy a `dataType.validate()`; vzor v [api.md](./api.md), sekce 1.0. Pozor, že klíč navíc je jen `warning`, ne `error`. |
| 13 | **`Top` nepřidává tlačítko identity.** README `caio-ui`: přidá se až s propem `displayIdentity`, který zatím není. | Přihlášení není v liště. | Položku *Přihlásit se* / `UiAuth.IdentityItem` si appka vloží do `top.menu.itemList` sama a zavolá `UiAuth.useSession().login()`. |
| 14 | **`caio-ui` nemá `exports` mapu** a `config.js` čte `process.env.OUTPUT_NAME`, které `createViteConfig` nedefinuje. | `ReferenceError: process is not defined`, ošklivé submodulové importy. | Importovat z root barrelu (`import { UiApp } from "caio-ui"`); `OUTPUT_NAME` si appka dodefinuje ve `vite.config.js` (`define`). |
| 15 | **GCS negeneruje náhledy.** | Fotogalerie by stahovala originály. | Dvě binárky na fotku (náhled `w400` + plná `w1600`), zmenšení na klientu přes `uu5imagingg01-tools`. Viz sekce 3.1 a [data-model.md](./data-model.md), sekce 9. |
| 16 | **Lokální tarbally.** `caio-server`, `caio-ui` a `caio-devkit` nejsou v registry; appka je konzumuje jako `file:../caio-architecture/…/dist/*.tgz` a samotné `npm install` novou verzi nevezme (npm ji má v cache). | Změna v knihovně se do appky nedostane. | Po každém `npm pack` v knihovně: `rm -rf node_modules/caio-ui && npm install --no-save --force file:…tgz` (postup v README `caio-ui`). |
| 20 | **`Uu5Bricks` a `uu5codekitg01` nejsou v závislostech.** Časová osa historie stojí na `Uu5Bricks.VerticalTimeline`, editace obsahu na `uu5codekitg01`; ani jeden není v `client/package.json`. | Bez nich se komponenta za běhu nenajde. | Přidat mezi závislosti klienta **a** do import mapy `uu5loaderg01` v `createViteConfig()` — uu5 knihovny se nebundlují. Ověřit při etapě obsahu. |
| 26 | ~~`Dao.createMany` vrací `ObjectId` a nechává v objektu `_id`~~ | – | **Vyřešeno 2026-09-06** v `caio-server` (`d2cc1d5`) — `createMany` vrací stejný tvar jako `create`; tarball přeinstalovaný. |

---

## 8. Fáze implementace

| Fáze | Obsah | Výstup |
|---|---|---|
| **0. Příprava** | Scaffold přes `caio-create-app` z lokálních tarballů, `.env`, Mongo, Google/Facebook OAuth, GCS bucket. Fonty, PWA ikony, `config/theme.js`, LSI kostra. | Prázdná appka běží lokálně i na GAE, v barvách a písmech předlohy. |
| **1. Jádro dat** | `team`, `season`, `match` (port z v1 do ESM), konfigurace aplikace, `binary/*` z knihovny. Správcovské CRUD obrazovky přes `UiElements.Crud`. | Redakce zvládne naplnit soutěž a zápasy. |
| **2. Osoby a soupisky** | `person`, `player`, `coach`, sestavy u zápasu (`playerList`), soupiska týmu. | Kompletní ER diagram v datech. |
| **3. Veřejný web** | Home, zápasy, tabulka (vč. bodování na penalty), detail zápasu, soupiska, profil hráče, statistiky – ve vzhledu podle [ux-design-system.md](./ux-design-system.md). | Web použitelný pro návštěvníka. |
| **4. Obsah** | Entity `page` a `article` (obsah = `uu5String` v `content`), seed stránek z v0, články s vazbou na zápas, RSS. | Redakce publikuje novinky a mění obsahové stránky. |
| **5. Média** | Fotogalerie (náhled + plná verze), soubory ke stažení. | Kompletní rozsah. |
| **6. Migrace a přepnutí** | Migrace dat z MySQL a z Mongo v1, přesměrování starých URL, ostrý provoz. | Vypnutí PHP webu. |

---

## 9. Otevřené otázky

1. ~~**Diskuze**~~ – **rozhodnuto: vyhazuje se.** Poslední příspěvek 2017, mezi příspěvky
   spam. Staré URL `/diskuze*` vedou 301 na `/home`, data se archivují exportem.
2. ~~**Klubová kasa**~~ – **rozhodnuto 2026-09-06: mimo rozsah a bez archivace.** Nedělá se
   žádný export `prijem`/`pokuta`/`vydaj`; MySQL dump ze starého webu při migraci stejně
   vznikne, takže data nikam nemizí a vytáhnou se z něj, kdyby je někdo hledal.
   `/pokladna`, `/pokuty`, `/prijem`, `/vydaj` vrací **410 Gone**.
3. ~~**Tréninky**~~ – **rozhodnuto 2026-09-06: obsahová stránka** `page?code=training`.
   Je to text, který trenér jednou za sezónu přepíše; entita s docházkou by byla nová
   kolekce, CRUD, admin obrazovka a role kvůli tomu, co dnes nikdo nesleduje.
4. ~~**Vazba osoba ↔ identita**~~ – **rozhodnuto 2026-09-06: páruje se automaticky podle
   ověřeného e-mailu.** Detail a jeho pojistky: [api.md](./api.md), sekce 2.5.
5. ~~**Sloučení `player` a `coach`**~~ – **rozhodnuto 2026-09-06: zůstávají oddělené.**
   Atributy se liší (post a číslo dresu vs. role `headCoach`/`assistant`/`manager`/`board`),
   sloučení by udělalo polovinu polí prázdných. Viz [data-model.md](./data-model.md), sekce 14.
6. ~~**Struktura mužstev**~~ – **rozhodnuto: kategorie jsou dynamické.** Odvozují se ze sezón
   (`season/listCurrent`), nikde se nevyjmenovávají. `appConfig.teams` a `homeAge` z v1
   zanikají. Viz [frontend.md](./frontend.md), sekce 2.5.
7. ~~**Týmové fotky**~~ – **rozhodnuto: obsahová stránka** `page?code=team-photos`,
   chronologicky, odkazovaná z historie.
8. ~~**Velikost hero nadpisu**~~ – **rozhodnuto 2026-09-06: drží se GDS strop 44/52.**
   Hero bude menší než na mockupech; důraz se bere odjinud (fotka přes celou šířku, červený
   eyebrow, prostrkání). **V `theme.js` tedy nezůstává jediné `fontSize`** a pravidlo
   „velikosti vždy z uuGds“ platí bez výjimky — nemá smysl ho lámat hned na první obrazovce.
9. ~~**Časová osa historie**~~ – **rozhodnuto: `Uu5Bricks.VerticalTimeline`**, registrovaná
   do `uu5String`, aby osa zůstala obsahem sekce stránky. Zbývá jen ji přidat mezi
   závislosti klienta a do import mapy loaderu (riziko #20).
10. ~~**Články a ECC**~~ – **rozhodnuto 2026-09-06:** článek drží obsah jako plain
    `uu5String` v `content`, stránka jako `sectionList` polí objektů `{ content }`.
    Editace zatím jako kód, `UiEcc` se nepoužívá. Viz sekce 2 a [api.md](./api.md), 2.8 a 2.9.
11. ~~**Skrytí jmen mládeže**~~ – **rozhodnuto 2026-09-06: filtruje server**, ne klient.
12. ~~**Stránkování**~~ – **rozhodnuto 2026-09-06: `pageInfo` se doplní do `caio-serveru`**,
    ne obchází na klientu.
