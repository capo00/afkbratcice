# TODO — co zbývá do hotového webu

Stav k **2026-09-06**, větev `feature/caio`.

Zadání vlastní [`design/`](./design/) — tenhle soubor jen říká, **co z něj ještě není
udělané** a v jakém pořadí to dává smysl dělat. Když si odporují, vyhrává `design/`.

---

## Kde to stojí

| Vrstva | Hotovo | Chybí |
|---|---|---|
| Server | sportovní jádro (`team`, `season`, `match`, `person`, `player`, `coach`), statistiky a tabulka, galerie, `file/list`, konfigurace, iCal, sitemap, přihlášení z knihovny | `article`, `page`, `/rss`, `pageInfo` v seznamech, ID-based přesměrování |
| Klient — veřejná část | rám, 10 primitivů, self-hostovaná písma, home (hero, statistiky, program víkendu, poslední výsledky, tabulky, CTA), mužstva, soupiska, zápasy, tabulka, statistiky, detail zápasu, kolo, profil hráče, fotogalerie s lightboxem, 404 | aktuality, obsahové stránky, ke stažení, profil uživatele |
| Klient — administrace | – | **všech 12 obrazovek** |
| Provoz | dev proti lokálnímu Mongu | GCS, OAuth, SMTP, migrace, deploy |

Rozpad po obrazovkách je v [`design/frontend.md`](./design/frontend.md), sekce 12.

---

## 1. Blokátory obsahu

Bez těchhle dvou entit nejde spustit web s obsahem — jsou to jediné dvě věci, které dnes
**vedou z odkazů do prázdna**.

### 1.1 Entita `page` (obsahové stránky)

- `server/page/{dao,crud,api}.js` — `code`, `name`, `desc`, `sectionList: [{ content }]`.
  Kontrakt: [`api.md`](./design/api.md), 2.9.
- `tools/seed-pages.js` — obsah přepsaný z v0 (historie, hymna, kontakt s mapou, výbor,
  tréninky, týmové fotky). Bez seedu jde web do provozu se šesti prázdnými stránkami.
- Klient: routa `page?code=…` + aliasy `history`, `hymn`, `contact`, `board`; komponenty
  `SectionList`, `Content` (`Utils.Uu5String.toChildren`) a `ContentEditModal`.
- **`server/legacy-redirect.js` na tyhle kódy míří už teď** (`/historie` →
  `/page?code=history`, `/vybor`, `/tymove_fotky`, `/treninky`, `/hymna`, `/kontakt`) —
  do té doby končí šest starých URL na 404.
- Časová osa historie: `Uu5Bricks.VerticalTimeline` registrovaná do `uu5String` (viz 5.2).

### 1.2 Entita `article` (aktuality)

- `server/article/{dao,crud,api}.js` — obsah je `content` (`uu5String`), `list` ho nevrací.
- Klient: routy `news?pageIndex` a `article?id`, blok **Aktuality na home** (dnes na
  stránce chybí úplně), `admin/articles`.
- `GET /rss` — má co publikovat teprve s články.
- `legacy-redirect` posílá `/home-<n>` na `/news?pageIndex=…`, takže stránkování novinek
  ze starého webu dnes taky končí na 404.

---

## 2. Zbytek veřejné části

- **Ke stažení** (`files?category`) — `file/list` na serveru je, ale `category` a `date`
  **nikdo nezapisuje**, dokud nevznikne `admin/files` (riziko #25). Stránka by dnes byla
  jeden nesekcovaný seznam.
- **Profil přihlášeného uživatele** (`profile`) — vlastní údaje, spárovaná osoba, role.
- **Odběr kalendáře** — `GET /calendar/team-<id>.ics` server umí, klient na něj zatím
  nikde neodkazuje (patří k zápasům mužstva).
- **SEO za běhu** — `document.title` a OG tagy na detailu zápasu, článku a alba
  ([`frontend.md`](./design/frontend.md), 10).

---

## 3. Administrace (12 obrazovek)

Nic z toho zatím není. Sedm z nich je podle návrhu jen konfigurační objekt nad
`UiElements.Crud`, zbytek má něco navíc.

| Obrazovka | Navíc oproti `CONFIG` objektu |
|---|---|
| `admin/teams` | logo, nově i týmová fotka a perex (viz 4.2) |
| `admin/seasons` | přiřazení týmů, **`hasPenalties`** |
| `admin/matches` | modály *Zapsat výsledek*, *Zapsat sestavu*, *Hromadně* (JSON import rozlosování z OFS) |
| `admin/persons` | – |
| `admin/players` | členství v týmech (`addTeam` / `endTeam`) |
| `admin/coaches` | – |
| `admin/articles` | `ContentEditModal` nad `content` |
| `admin/galleries` | hromadný upload fotek (sekvenčně, dvě binárky na fotku) |
| `admin/files` | **vlastní `Crud` nad `BinaryProvider`** — `BinaryCrud` je nerozšiřitelná a chybí jí `category`/`date` |
| `admin/pages` | `ContentEditModal` nad `sectionList` |
| `admin/identities` | `identity/adminList` + `update`; `teamEditor:<id>` ukazovat jako **název týmu**, ne holé id |
| `admin/config` | `appConfig/update` |

K tomu:

- Guard obrazovek vázaných na mužstvo přes `withRoute(..., { profileList: ["teamEditor:*"] })`
  a `UiAuth.getScopeList()` — v `caio-ui` je to hotové, v appce se to zatím nepoužívá.
- Zmenšování obrázků před uploadem (`uu5imagingg01-tools`): logo 400 px, portrét 600 px,
  týmová fotka a titulní foto článku 1200 px, fotka v galerii 1600 + 400 px.

---

## 4. Rozhodnutí, která čekají na implementaci

Tohle je odsouhlasené a zapsané v návrhu, jen to ještě nikdo nenapsal.

### 4.1 `pageInfo` v `caio-serveru` (riziko #9)

`Dao.find` vrací holé pole, takže **žádný seznam na stacku nevrací `pageInfo`**.
`UiElements.Crud` volá `handlerMap.loadNext({ pageInfo: { pageIndex } })` a `useDataList`
bez `total` neví, kdy přestat — nejde tedy stránkovat novinky, dotahovat fotky v albu ani
listovat administrací. Seznamy dnes jedou na jednu dávku `pageSize: 1000`, což pro dnešní
objem stačí, ale **po migraci ~2 600 fotek už ne**. Detail: [`api.md`](./design/api.md), 1.0.1.
Mění tvar odpovědi každého seznamu → **ověřit i na `caio_propertyman`**.

### 4.2 `team.desc`, `photoUri`, `photoDesc`

Karta mužstva v přehledu je bez nich neúplná (dnes se vykreslují podmíněně, takže po
doplnění polí se rozsvítí samy). Server: `team/api.js` + `crud.js` stejnou cestou jako logo,
jen `type: "photo"`.

### 4.3 Skrytí jmen mládeže na serveru

`appConfig.hideNamesAgeList` je dnes jen klientský příznak, takže **jména dětí jsou
v odpovědi API**. Filtr patří do `crud` vrstvy stejně jako kontakty a `departureTime`:
`player`/`coach` u kategorie z `hideNamesAgeList` vrací `person` bez `name` a `surname`
každému bez role z `CONTENT` (a mimo `self`); týká se i sestavy v `match/get`
a `stats/listPlayerStats`. Klient už s tím počítá — vykreslí číslo dresu.

### 4.4 `person/linkSelf`

Automatické spárování osoby s identitou podle **ověřeného** e-mailu; volá ho klient jednou
po přihlášení z `app-contextu`. Pravidla a pojistky: [`api.md`](./design/api.md), 2.5.1.

---

## 5. Provozní a drobné

### 5.1 Nenakonfigurované prostředí

| Co | Důsledek, dokud chybí |
|---|---|
| `GCS_BUCKET_NAME` | `binary/*` se nezaregistrují; **upload fotek nebyl nikdy otestovaný** — galerie se ověřovala proti ručně vloženým binárkám mířícím na statické assety |
| `GOOGLE_CLIENT_ID` / `SECRET`, `FACEBOOK_*` | přihlášení jen e-mailem a heslem |
| `SMTP_HOST`, `MAIL_FROM`, `APP_URL` | reset hesla se nenabízí (`passwordResetEnabled: false`) |

### 5.2 Chybějící klientské závislosti

`Uu5Bricks` (časová osa historie) a `uu5codekitg01` (editace obsahu) nejsou
v `client/package.json`. Nestačí je přidat do závislostí — musí i **do import mapy
`uu5loaderg01`** v `createViteConfig()`, protože uu5 knihovny se nebundlují (riziko #20).

### 5.3 Hero bez fotky

Hero na home má zatím radiální přechod místo fullbleed fotky s tmavým překryvem. Souvisí
s tím i potvrzené rozhodnutí, že **nadpis drží GDS strop 44/52 px** — důraz musí přijít
z fotky, erbu, eyebrow a prostrkání, ne z velikosti písma.

### 5.4 `?mode=forgot`

Rozhodnuto, že se **neřeší**: odkaz na reset hesla nebude nikde jinde než na přihlašovací
stránce, takže `/zapomenute-heslo` končí na `/login.html` a uživatel klikne ještě jednou.
Zapsáno, ať se to znovu neotvírá.

---

## 6. Migrace a nasazení

- **Etapa 11 — migrace dat.** MySQL (v0) i Mongo (v1). Návrh je v
  [`migration.md`](./design/migration.md), MySQL dump zatím není k dispozici.
  Vzniká při ní `migration_map`, bez které nejdou dodělat **ID-based přesměrování**
  (`/novinka-<n>`, `/informace-o-zapase-<n>`, `/fotogalerie-<n>`) — statická fungují.
  Kroky 9 a 11 (články, stránky) jdou až po entitách z kapitoly 1.
- **Etapa 12 — deploy na GAE.** GCP projekty existují (prod + dev), env se doplní později.
- **Regresní test tabulky** proti v0 `/api/getTable` za poslední tři sezóny — podle plánu
  je to součást etapy, ne dodatek. Jde udělat teprve s migrovanými daty.

---

## 7. Testy

Server nemá **žádné automatické testy**; `npm run smoke` je smoke test proti běžícímu
serveru a reálnému Mongu (bodování tabulky, autorizace včetně rozsahové role, pohledy na
zápasy, ochrana osobních údajů, přesměrování, iCal, sitemap). Je to náhrada za integrační
testy, ne za ně.

Co by mělo přibýt, až se ustálí rozsah:

- jednotkové testy `services/table.js` (bodování 3/2/1/0, `hasPenalties`, pořadí formy,
  vzájemné zápasy jako druhé kritérium) — je to nejcitlivější kus serveru,
- jednotkové testy `services/stats.js` a `services/season.js` (`yearFrom` přes přelom roku),
- rozšířit `smoke.js` o galerii, statistiky hráčů a nové filtry (`playerId`, `idList`).

Klient testy nemá a zatím se neověřuje jinak než spuštěním. **Ikony a texty se ověřují
v prohlížeči** — neexistující GDS ikona se vykreslí jako prázdné místo se správnou šířkou
a build ani konzole na to neupozorní (viz [`component-tree.md`](./design/component-tree.md), F.2).

---

## Doporučené pořadí

1. **`page` + seed obsahu** — odblokuje šest starých URL a dá webu obsahové stránky.
2. **`article` + aktuality + `/rss`** — nejsledovanější obsah po zápasech.
3. **`pageInfo` v `caio-serveru`** — dřív, než ho začne potřebovat administrace i galerie.
4. **Administrace** — bez ní redakce nemá jak cokoli naplnit; `admin/files` odblokuje
   „Ke stažení", `admin/seasons` `hasPenalties`.
5. **Hero fotka a GCS** — vizuál a média do provozuschopného stavu.
6. **Migrace + deploy.**
