# Konfigurace — co kde bude

Datum: 2026-09-05

Přehled všech míst, kde se appka konfiguruje, a co přesně v nich je. Hodnoty vzhledu jsou
odečtené z předlohy — zdůvodnění a širší kontext v
[ux-design-system.md](./ux-design-system.md).

Pět míst, každé s jednou zodpovědností:

| Soubor | Zodpovědnost | Kdo čte |
|---|---|---|
| `.env` / `.env.development` | tajemství a adresy služeb | server |
| `server/config.js` | doménové konstanty a číselníky | server |
| `client/src/config/config.js` | technická konfigurace klienta | klient |
| `client/src/config/theme.js` | **designové tokeny** | klient |
| `client/src/lsi/cs.json` | **všechny texty** | klient |
| kolekce `app_config` (Mongo) | co mění redakce za běhu | oba |

---

## 1. `client/src/config/theme.js` — designové tokeny

**Jediné místo v celé appce, kde smí být hex a velikost písma.** Když se v JSX objeví
`"#..."` nebo `fontSize: 48`, je to chyba.

### 1.1 Barvy

Tmavé schéma, hue 25–30 (teplá). Nikde není čistá černá ani čistá bílá.

- `bg: "#070404"` — základní podklad stránky
- `card: "#120D0C"` — podklad karet (zápas, článek, hráč)
- `surface: "#1D1716"` — jemné plochy, neaktivní filtr chip
- `accent: "#2A1B19"` — zvýrazněný řádek tabulky (vlastní tým)
- `border: "#2C2423"` — rámečky karet, oddělovače
- `input: "#362E2D"` — rámeček formulářového vstupu
- `fg: "#F3EFED"` — základní text
- `mutedFg: "#99908E"` — sekundární text, perex, popisky, vzdálenosti
- **`clubRed: "#D01319"`** — klubová červená: CTA, eyebrow, aktivní nav, skóre, pruh u nadpisu
- `clubRedBright: "#F92725"` — hover a plný CTA pruh
- `onRed: "#FEF7F2"` — text na červené
- `destructive: "#E7000B"` — chyby

Navíc se červená registruje jako GDS význam, aby ji uu5 komponenty braly bez explicitních
barev: `Uu5Elements.UuGds.setMeaningColor("primary", "#D01319")`.

### 1.2 Písma

- `font.display: '"Bebas Neue", Impact, Haettenschweiler, sans-serif'` — nadpisy, čísla,
  tlačítka. **Jen jedna váha (400)** — nikdy nepředepisovat 700, prohlížeč by ji
  nasyntetizoval.
- `font.body: '"Barlow", system-ui, sans-serif'` — text a UI.

Oba fonty se **self-hostují** (`client/public/assets/fonts/*.woff2` + `@font-face`
v `client/src/fonts.css`), ne přes `<link>` na Google Fonts — kvůli GAE a offline.

### 1.3 Typografie — velikosti **vždy** z uuGds

**V `theme.js` není jediné `fontSize`.** Každá role je odkaz na GDS token; velikost,
řádkování i váhu spočítá `Uu5Elements.Text` a předá jako `style`. GDS má i vlastní mobilní
sadu (`smallScreen`), takže žádné `textMobile` neexistuje — kdyby existovalo, přebilo by GDS.

`theme.typography[role] = { token: [category, segment, type], style: {…} }`, kde `style`
nese **jen to, co GDS nemá**: `fontFamily`, `letterSpacing`, `textTransform`, barvu.

- `h1` (hero) → `expose/default/hero` — 44/52, mobil 32/38; + Bebas, ls `.04em`, uppercase
- `h2` (sekce) → `interface/title/main` — 32/36, mobil 24/28; + Bebas, ls `.04em`, uppercase
- `h3` (karta) → `story/heading/h5` — 18/22, mobil 17/20
- `h4` → `interface/title/minor` — 18/20
- `body` → `interface/content/large` — 16/22
- `perex`, popisky → `interface/content/medium` — 14/20, barva `mutedFg`
- `score`, velká čísla → `expose/default/lead` — 34/40; + Bebas
- `eyebrow` → `interface/highlight/small` — 12/14; + váha 700, ls `.25em`, uppercase, `clubRed`
- popisek fotky → `story/special/caption` — 12/16, barva `mutedFg`
- tlačítko → `interface/interactive/medium`, řeší `Uu5Elements.Button` sám

**Jediné povolené přebití GDS: `fontWeight: 400` u rolí sázených Bebasem.** GDS u `hero`
a `h5` předepisuje 700, ale Bebas Neue má jen jednu váhu — prohlížeč by ji nasyntetizoval
a písmo by se rozmazalo.

Důsledek proti mockupům: hero bude **44 px místo 96**, nadpis sekce **32 místo 48**.
Je to cena za jednotnou sazbu s uu5 komponentami; podrobně
[ux-design-system.md](./ux-design-system.md), sekce 2.3.

### 1.4 Rozměry

- `radius: 8`
- `maxWidth: 1152` — šířka obsahu
- `gutter: { xs: 16, s: 24 }` — boční padding sekce
- `sectionPad: 64` — vertikální padding sekce
- `topHeight: 64` — výška horní lišty (+1 px spodní border = 65)
- `cardStripe: 3` — červený proužek nad kartou zápasu

Rozestupy uvnitř komponent se **neřeší tady** — dává je `Uu5Elements.SpacingProvider
type="loose"` obalující celou appku (`useSpacing()` → a2/b16/c24/d32).

---

## 2. `client/src/config/config.js` — technická konfigurace klienta

- `TAG` — prefix `data-name` atributů komponent (`"AfkBratcice"`)
- `Css` — instance `Utils.Css.createCssModule(TAG)`, přes ni jdou všechna přebití
- `asset` — cesty ke statice: logo (`/assets/meta/icon-192.png`), erb, placeholder fotky
- **číselníky (jen kódy a pořadí, popisky jsou v LSI):**
  - `AGE_LIST` — **všechny možné** kategorie; které jsou letos aktivní, říká
    `season/listCurrent`, ne tenhle seznam
  - `POSITION_LIST` — `GK`, `DF`, `MF`, `FW` + pořadí skupin na soupisce
  - `MATCH_STATE_LIST`, `ARTICLE_STATE_LIST`, `COACH_ROLE_LIST`, `GALLERY_CATEGORY_LIST`
  - `PROFILE_LIST` — `members`, `teamEditor`, `matchEditor`, `newsEditor`, `galleryEditor`,
    `contentEditor`, `operatives`, `authorities`; `teamEditor` je parametrizovaný
    (`teamEditor:<teamId>`) — viz [roles.md](./roles.md)
  - množiny rolí pro `auth` (`ADMIN`, `CONTENT`, `MATCH`, `NEWS`, `GALLERY`, `PAGES`,
    `MEMBER`) — zrcadlí `server/config.js`
- `PAGE_SIZE` — `{ news: 10, matches: 50, photos: 40 }`
- `IMAGE_WIDTH` — `{ logo: 400, person: 600, article: 1200, photo: 1600, thumb: 400 }`
  (šířky pro zmenšení na klientu — GCS náhledy negeneruje)
- `DATE_FORMAT` — locale `cs-CZ`, časová zóna `Europe/Prague`

> `OUTPUT_NAME`: `caio-ui` si ho čte z `process.env`, ale `createViteConfig()` ho nedefinuje →
> `ReferenceError: process is not defined`. Appka ho musí doplnit ve `vite.config.js`
> přes `define` (viz [README.md](./README.md), riziko #14).

---

## 3. `client/src/lsi/cs.json` — texty

Žádný text nepatří natvrdo do komponenty. Struktura klíčů kopíruje obrazovky:

```
header.nav.*          položky menu
header.login          Přihlásit se
home.hero.*           titulek, podtitul, perex, dvě CTA
home.stats.*          popisky tří dlaždic
home.matches.*        eyebrow + nadpis + prázdný stav
home.results.*        eyebrow + nadpis + VÝHRA / REMÍZA / PROHRA
home.news.*           eyebrow + nadpis + Zobrazit všechny
home.tables.*         eyebrow + nadpis + poznámka o staré gardě
home.cta.*            nadpis, perex, tlačítko
teams.*, team.*, match.*, player.*, gallery.*, files.*, article.*
program.*             program víkendu, prázdný stav
round.*               kolo soutěže
countdown.*           „za ${days} dnů ${time}“
enum.age.*, enum.position.*, enum.matchState.*, enum.coachRole.*, enum.galleryCategory.*
error.*               prázdné stavy a chybové hlášky
admin.*               nadpisy správcovských obrazovek
```

**Zatím jen čeština.** `languageList = ["cs"]` a `en.json` se **nezakládá** — prázdný soubor
by jen předstíral, že web umí anglicky. Přidání jazyka = nový `<lang>.json`, řádek
v `IMPORT_BY_LANGUAGE` a kód v `languageList`; struktura klíčů se nemění.

**Obsah v ECC je na víc jazyků připravený už teď:** sekce ukládá `contentMap: { cs: … }`,
takže druhý jazyk nebude znamenat migraci dat, jen doplnění jazyka do volání
(viz [data-model.md](./data-model.md), sekce 10).

Popisky tlačítek `UiElements.Crud` jdou z LSI `caio-ui`, ne z appky.

---

## 4. `server/config.js` — doménové konstanty

- `AGE_MAP` — `old`, `men`, `u18`, `u16`, `u14`, `u12`, `u10`, `u6` (převzato z v1)
- `POSITION_MAP` — `GK`/`DF`/`MF`/`FW` + zkratky B/O/Z/Ú
- `MATCH_STATE`, `ARTICLE_STATE`, `COACH_ROLE`, `GALLERY_CATEGORY`
- `PROFILE` — `members`, `teamEditor`, `matchEditor`, `newsEditor`, `galleryEditor`,
  `contentEditor`, `operatives`, `authorities` + množiny pro `auth`
  (`ADMIN`, `CONTENT`, `MATCH`, `NEWS`, `GALLERY`, `PAGES`, `MEMBER`);
  viz [roles.md](./roles.md)
- `BINARY_COLLECTION` — `sys`, `team`, `person`, `article`, `gallery`, `page`, `file`;
  každá má vlastní autorizaci (viz [roles.md](./roles.md), 5.1)
- **`POINTS`** — bodování tabulky: `{ win: 3, penaltyWin: 2, penaltyLoss: 1, loss: 0, draw: 1 }`
  (zachovává chování v0 `getTable.php`)
- `SEASON_START_MONTH: 8` — sezóna začíná v srpnu; `yearFrom = měsíc < 8 ? rok - 1 : rok`
- `LOCK_TIMEOUT_MS` — expirace ECC zámku, 8 hodin
- `DEFAULT_PAGE_SIZE` — 1000 (výchozí `Dao.find`)
- `ERROR_PREFIX: "afkbratcice"` — prefix aplikačních chybových kódů

---

## 5. `.env` / `.env.development`

Žádná proměnná není z pohledu startu povinná — server nastartuje i s prázdným souborem
a chybějící schopnosti se prostě nenabídnou.

| Proměnná | Prakticky nutná | K čemu |
|---|---|---|
| `NODE_ENV` | ne | `development` načte `.env.development` |
| `PORT` | ne | **`8081`** — jiný než propertyman (8080), aby šly obě appky pustit vedle sebe |
| `MONGODB_URI` | **ano** | databáze; **bez query stringu** — knihovna si `?retryWrites=…` lepí sama |
| `GCS_BUCKET_NAME` | **ano** | bucket pro binárky; jinak se `binary/*` nezapnou. **Jiný bucket pro dev a prod** |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | volitelné | Google přihlášení |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | volitelné | Facebook přihlášení |
| `JWT_SECRET`, `JWT_LIFETIME` | volitelné | výchozí `GOOGLE_CLIENT_SECRET`, `1d` |
| `GOOGLE_APPLICATION_CREDENTIALS` | ne | override ADC; lokálně stačí `gcloud auth application-default login` |
| `BINARY_MAX_FILE_SIZE_MB`, `BINARY_MAX_FILES` | ne | výchozí 25 MB / 20 souborů |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | **ano, jakmile bude reset hesla** | odesílání e-mailu s odkazem na reset; bez nich `/auth/config` hlásí `passwordResetEnabled: false` |

---

## 6. Kolekce `app_config` — co mění redakce za běhu

Singleton v Mongu, čte se jednou při startu SPA (`appConfig/get`).

- `categoryOrder` — pořadí kategorií v menu: `["men","u18","u16","u14","u12","u10","u6","old"]`
  (od nejstarších; **stará garda je výjimka na konci**). Jen seřazení, ne výčet.
- `hideNamesAgeList` — `["u14","u12","u10","u6"]`; u dorostu (`u18`, `u16`) se jména ukazují
- `notice` — text proužku „Upozornění“ pod horní lištou (dnes „Trénink: pátek 17:00“);
  prázdné = proužek se nezobrazí
- `contact` — `{ address, gps, email, phone, ico, bankAccount, mapUrl }`
- `socialList` — `[{ code, uri }]`, dnes jen Facebook
- `fileCategoryList` — `[{ code, name }]`, kategorie souborů ke stažení (náhrada v0 `serial`)
- `founded` — rok založení (1932) pro dlaždici statistik

**Kategorie se sem nepíšou.** Složení mužstev se mění každou sezónu, takže zdrojem pravdy je
kolekce `season` a use case `season/listCurrent`; `appConfig` k tomu dodává jen pořadí
a výjimky. Původní `teams` a `homeAge` z v1 zanikly.

**Hranice:** co může redakce změnit bez nasazení, patří sem. Co je designové rozhodnutí
(barvy, písma, rozměry), patří do `theme.js` a mění se commitem.
