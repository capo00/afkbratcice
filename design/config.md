# Konfigurace — co kde je

Datum: 2026-09-05, přepsáno 2026-11-02 na tři vrstvy konfigurace stacku (caio-devkit README,
*Konfigurace appky*).

**Každá hodnota má jedno místo podle toho, kdo ji čte a kdo a kdy ji mění.**

| Vrstva | Soubor nebo úložiště | Co v ní je | Kdo čte | Mění se |
|---|---|---|---|---|
| 1. Prostředí | `.env.development` (lokálně), `.env` (produkce); v gitu jen `.env.example` | databáze, přihlášení, tajemství, porty, adresa webu, bucket, `QA_*` | server | s prostředím |
| 2a. Build + společné | `caio.config.js` | jméno, popis, jazyk, téma, boot screen, PWA, UVE, deploy; `app`: číselníky, role, kolekce binárek, výchozí nastavení klubu | devkit, server (`AppConfig`), klient (`UiApp.AppConfig`) | s vydáním |
| 2b. Server | `server/server.config.js` | `errorPrefix`, `auth.jwtLifetime`; `app`: typy binárek | server | s vydáním |
| 2c. Klient | `client/client.config.js` | `tag`; `app`: písma, rozměry, statické soubory, popisky sítí | klient | s vydáním |
| 3. Nastavení | kolekce `sys_settings` | pošta, registrace; `app`: upozornění, kontakt, sítě, pořadí kategorií, skrytá jména, rok založení, kategorie souborů | server `Settings.get()`, klient `UiApp.useSettings()` | za běhu, správce |
| texty | `client/src/lsi/cs.json` | všechny texty včetně popisků číselníků | klient | s vydáním |

Pravidla: liší se podle prostředí nebo je tajemství -> vrstva 1; mění ho správce bez vydání ->
vrstva 3; jinak vrstva 2 (stejné pro server i klienta nebo potřebné pro build -> `caio.config.js`,
jen pro jednu stranu -> `server.config.js` / `client.config.js`). Hodnota použitá v jediném souboru
není konfigurace, zůstává konstantou v kódu (`server/config.js`: bodování tabulky, začátek sezóny).
Ve všech souborech vrstvy 2 jsou klíče 1. úrovně standardní (stack je validuje), hodnoty appky jen
pod `app`.

`server/config.js` a `client/src/config/config.js` zůstávají jako místo, odkud kód hodnoty čte
pod dosavadními jmény (`Config.AGE_LIST`, `Config.ROLE.AUTHORITIES`, …) -- samy už žádnou společnou
hodnotu nedrží. V ostatních dokumentech `design/` znamená `appConfig.<klíč>` dnes nastavení klubu
(`sys_settings.app`, sekce 3).

---

## 1. Prostředí (`.env`, `.env.development`, `.env.example`)

Seznam klíčů se štítky (`[optional]`, `[required]`, `[local]`, `[production]`) je `.env.example`;
`npm run check-env` porovná skutečné soubory s ním a s registrem klíčů caio-serveru (jen klíče,
nikdy hodnoty). `npm run dev` jen varuje, `npm run deploy` se zastaví.

| Klíč | Kde | K čemu |
|---|---|---|
| `PORT` | lokálně | 8082; na App Engine ho nastavuje platforma |
| `MONGODB_URI` | všude, povinný | databáze; **bez query stringu** |
| `JWT_SECRET` | všude, povinný | podpis přihlašovacích tokenů, v produkci jiný než lokálně |
| `APP_URL` | produkce, povinný | sitemap, robots.txt, canonical, og:image |
| `CANONICAL_HOST` | volitelný | hlavní host, až po přepnutí DNS |
| `GCS_BUCKET_NAME` | všude, povinný | bucket binárek; jiný lokálně a v produkci |
| `GOOGLE_CLIENT_ID`/`SECRET`, `FACEBOOK_APP_ID`/`SECRET` | volitelné | přihlášení přes providera |
| `SETTINGS_SECRET_KEY` | volitelný | šifruje heslo SMTP v Nastavení (32 bajtů base64); bez něj heslo uložit nejde |
| `CLIENT_PORT` | jen lokálně | port Vite dev serveru (dřív `VITE_PORT` v `client/.env.development`, ten soubor zanikl) |
| `QA_ADMIN_*`, `QA_TEAMEDITOR_*` | jen lokálně | testovací účty (`npm run qa-accounts`) |

Zaniklo: `JWT_LIFETIME` (-> `server.config.js`), `SMTP_*` a `MAIL_FROM` (-> Nastavení, pošta).
`MONGODB_URI_OLD` v produkčním `.env` stack nezná (`check-env`: unknown).

---

## 2. Konfigurační soubory (vrstva 2)

- **`caio.config.js`** -- `name`, `description` (titulek, manifest, og), `languages: ["cs"]` (jen
  `<html lang>` a og:locale, žádné adresy `/cs/…`), `theme` (dvě palety, sekce 4), `boot`,
  `pwa.themeColor: "clubRed"` (theme_color manifestu), `uves.admin`, `deploy`. Pod `app`:
  `ageList`, `positionList`, `lineupPositionMap`, `matchStateList`, `articleStateList`,
  `galleryStateList`, `galleryCategoryList`, `coachRoleList`, `role` a `roleGroup` (množiny pro
  `auth`, [roles.md](./roles.md)), `binaryCollection` a `settingsDefaults` (sekce 3). Popisky
  číselníků jsou v LSI; že každý kód nějaký má, hlídá `client/src/config/enum-lsi.test.js`.
- **`server/server.config.js`** -- `errorPrefix: "afkbratcice"` (`Error.code("article", "notFound")`),
  `auth.jwtLifetime`, `app.binaryType`. Předává se `App.init({ config })`.
- **`client/client.config.js`** -- `tag: "Afk."`, `app.font`, `app.layout`, `app.asset`,
  `app.socialLabel`. Předává se `<UiApp.SpaProvider config>` v obou UVE. Odkaz do administrace v liště
  webu (`top.adminLink`) v něm není: role skládá `config/admin-menu.js` z obrazovek.

---

## 3. Nastavení klubu (`sys_settings.app`, vrstva 3)

Co mění správce za běhu, bez vydání. Do 2026-11 kolekce `afk_config` (dřív `app_config`) s use casy
`appConfig/get|update`; přesun dat dělá `tools/migrate-settings.js` (README, *Vydání*).

- **`app.public`** (vidí kdokoli, `sys/settings/get`): `notice` (proužek s upozorněním na detailu
  mužstva; prázdné = žádný), `founded` (rok založení pro dlaždici statistik a patičku),
  `categoryOrder` (pořadí kategorií v menu, kódy `afk_category`; jen seřazení, ne výčet),
  `hideNamesAgeList` (věkové skupiny, u kterých server nevydá jména dětí), `contact` (`address`,
  `email`, `phone`, `ico`, `gps`, `mapUrl`), `socialList` (`[{ code, uri }]`), `fileCategoryList`
  (`[{ code, name }]`, kategorie souborů ke stažení -- čte je administrace souborů a bude je číst
  veřejná stránka „Ke stažení“).
- **`app.private`** klub nemá (Caio 2026-11-02: nic z nastavení klubu není tajné); validátor přijme
  jen `{}`.
- **Výchozí hodnoty** jsou v `caio.config.js` `app.settingsDefaults` a doplňuje je server
  (`server/app-settings/`) i klient (`core/app-context.jsx`, formulář) -- platí, dokud správce část
  neuloží.
- **Úpravy:** administrace -> *Nastavení* (`/admin/config`, `UiAuth.Settings` z caio-ui), záložka
  *Klub* vedle Pošty a Registrace (`client/src/admin/settings.js`). Editují se všechny veřejné
  hodnoty kromě `fileCategoryList` -- ten zatím jen v databázi (formulář pro seznam není); uložení
  formuláře ho nechá, jak je.
- **Validace** na serveru: `App.init({ settings: { validatePublic, validatePrivate } })`
  (`server/app-settings/index.js`).

**Kategorie se sem nepíšou.** Složení mužstev se mění každou sezónu, takže zdrojem pravdy je kolekce
`season` a use case `season/listCurrent`; nastavení k tomu dodává jen pořadí a výjimky.

---

## 4. Designové tokeny (`client/src/config/theme.js`)

`theme.js` je skládá z vrstvy 2: **barvy (hexy) jen v `caio.config.js` `theme`**, písma a rozměry
v `client/client.config.js` `app.font` / `app.layout`. Velikost písma nikde -- dává ji uuGds. Když se
v JSX objeví `"#..."` nebo `fontSize: 48`, je to chyba. Výčet níž je návrh z 2026-09-05; paletu
dnes tvoří dvě sady rolí (světlá a tmavá) v `caio.config.js`.

### 4.1 Barvy

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

### 4.2 Písma

- `font.display: '"Bebas Neue", Impact, Haettenschweiler, sans-serif'` — nadpisy, čísla,
  tlačítka. **Jen jedna váha (400)** — nikdy nepředepisovat 700, prohlížeč by ji
  nasyntetizoval.
- `font.body: '"Barlow", system-ui, sans-serif'` — text a UI.

Oba fonty se **self-hostují** (`client/public/assets/fonts/*.woff2` + `@font-face`
v `client/src/fonts.css`), ne přes `<link>` na Google Fonts — kvůli GAE a offline.

### 4.3 Typografie — velikosti **vždy** z uuGds

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

### 4.4 Rozměry

- `radius: 8`
- `maxWidth: 1152` — šířka obsahu
- `gutter: { xs: 16, s: 24 }` — boční padding sekce
- `sectionPad: 64` — vertikální padding sekce
- `topHeight: 64` — výška horní lišty (+1 px spodní border = 65)
- `cardStripe: 3` — červený proužek nad kartou zápasu

Rozestupy uvnitř komponent se **neřeší tady** — dává je `Uu5Elements.SpacingProvider
type="loose"` obalující celou appku (`useSpacing()` → a2/b16/c24/d32).

---

## 5. Texty (`client/src/lsi/cs.json`)

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
