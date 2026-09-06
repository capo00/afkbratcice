# TODO — co zbývá do hotového webu

Stav k **2026-09-06**, větev `feature/caio`.

Zadání vlastní [`design/`](./design/) — tenhle soubor jen říká, **co z něj ještě není
udělané** a v jakém pořadí to dává smysl dělat. Když si odporují, vyhrává `design/`.

---

## Kde to stojí

| Vrstva | Hotovo | Chybí |
|---|---|---|
| Server | sportovní jádro (`team`, `season`, `match`, `person`, `player`, `coach`), **`article`**, statistiky a tabulka, galerie, `file/list`, konfigurace, iCal, sitemap, **`/rss`**, přihlášení z knihovny | ID-based přesměrování (čeká na migraci) |
| Klient — veřejná část | rám, 11 primitivů, self-hostovaná písma, **české adresy**, home vč. **aktualit**, **novinky a detail článku**, mužstva, soupiska, zápasy, tabulka, statistiky, detail zápasu, kolo, profil hráče, fotogalerie s lightboxem, obsahové stránky, kontakt, 404 | ke stažení, profil uživatele |
| Klient — administrace | – | **všech 12 obrazovek** |
| Provoz | dev proti lokálnímu Mongu | GCS, OAuth, SMTP, migrace, deploy |

Rozpad po obrazovkách je v [`design/frontend.md`](./design/frontend.md), sekce 12.

---

## 1. Obsah

### 1.1 Text obsahových stránek

Stránky **fungují** (`/historie`, `/hymna`, `/vybor`, `/treninky`, `/tymove-fotky`), ale
mají v `client/src/content/pages.js` jen kostry — **text se má přepsat z běžícího
`afkbratcice.cz`**. Historii klubu, jména výboru ani slova hymny si nevymýšlíme.

Entita `page` se **nedělá** a počká na ECC (viz [`README.md`](./design/README.md), sekce 2).
Časová osa v historii je zatím obyčejný seznam — `Uu5Bricks.VerticalTimeline` chce
závislost z bodu 5.2.

---

## 2. Zbytek veřejné části

- **Ke stažení** (`ke-stazeni?category`) — `file/list` nad kolekcí `download` na serveru
  je, ale `category` a `date` **nikdo nezapisuje**, dokud nevznikne `admin/files`
  (riziko #25). Stránka by dnes byla jeden nesekcovaný seznam.
- **Profil přihlášeného uživatele** (`profile`) — vlastní údaje, spárovaná osoba, role.
- **Odběr kalendáře** — `GET /calendar/team-<id>.ics` server umí, klient na něj zatím
  nikde neodkazuje (patří k zápasům mužstva).
- **SEO za běhu** — `document.title` a OG tagy na detailu zápasu, článku a alba
  ([`frontend.md`](./design/frontend.md), 10). Sitemapa i RSS už české adresy vypisují
  správně, tohle je poslední kus SEO, který chybí.
- **Titulní foto článku** — `article/create|update` binárku uloží, ale nahrát ji jde teprve
  z `admin/articles`, a GCS zatím není nastavené (5.1).

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
| `admin/articles` | `ContentEditModal` nad `sectionList`; `setState` jako tlačítko, ne pole formuláře. **Bez ní se novinka nedá založit jinak než přímo v Mongu** — entita i veřejné obrazovky hotové jsou |
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

### 4.1 Adopce `pageInfo` v use casech appky

**V knihovně je to hotové** (`caio-server@cb3d8c0`): `Dao.findPage()`, `Dao.listPage()`,
`Crud.listPage()` a `binary/list`, který ho už vrací. Není to změna `find()` — ta by
rozbila každý dao v každé appce kvůli číslu, které potřebují jen list use case.

**`article/list` už na tom jede** — je to první a zatím jediný stránkovaný seznam appky.
Zbývá `gallery/listPhotos` (album po migraci ~2 600 fotek) a seznamy v administraci.
Dokud se nepřepnou, jedou na jednu dávku `pageSize: 1000` — což pro dnešní objem stačí.

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

`uu5codekitg01` **je v pořádku**: v `client/package.json` sice není, ale do import mapy
`uu5loaderg01` se dostane přes tranzitivní závislosti `caio-ui` a v prohlížeči se načítá
(ověřeno v konzoli, verze 2.8.3 — víc registr `repo.plus4u.net` nenabízí).

Chybí `Uu5Bricks` (časová osa historie). Nestačí ho přidat do závislostí — musí i **do
import mapy** v `createViteConfig()`, protože uu5 knihovny se nebundlují (riziko #20).

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
  Krok 9 (články) už má kam migrovat; krok 11 (stránky) počká na ECC — do té doby je to
  přepis do `client/src/content/pages.js`, ne migrace.
- **Etapa 12 — deploy na GAE.** GCP projekty existují (prod + dev), env se doplní později.
- **Regresní test tabulky** proti v0 `/api/getTable` za poslední tři sezóny — podle plánu
  je to součást etapy, ne dodatek. Jde udělat teprve s migrovanými daty.

---

## 7. Testy

Server nemá **žádné automatické testy**; `npm run smoke` je smoke test proti běžícímu
serveru a reálnému Mongu (bodování tabulky, autorizace včetně rozsahové role, pohledy na
zápasy, ochrana osobních údajů, novinky vč. publikačního okna a RSS, přesměrování, iCal,
sitemap). Je to náhrada za integrační testy, ne za ně.

Co by mělo přibýt, až se ustálí rozsah:

- jednotkové testy `services/table.js` (bodování 3/2/1/0, `hasPenalties`, pořadí formy,
  vzájemné zápasy jako druhé kritérium) — je to nejcitlivější kus serveru,
- jednotkové testy `services/stats.js` a `services/season.js` (`yearFrom` přes přelom roku),
- rozšířit `smoke.js` o galerii a statistiky hráčů.

Stav: **64 ok / 0 fail**.

Klient testy nemá a zatím se neověřuje jinak než spuštěním. **Ikony a texty se ověřují
v prohlížeči** — neexistující GDS ikona se vykreslí jako prázdné místo se správnou šířkou
a build ani konzole na to neupozorní (viz [`component-tree.md`](./design/component-tree.md), F.2).

---

## Doporučené pořadí

1. **Administrace** — teď je to jediná věc, která drží obsah: novinky, alba i soupisky jdou
   dnes naplnit jen zápisem přímo do Monga. `admin/articles` odblokuje redakci,
   `admin/files` „Ke stažení", `admin/seasons` `hasPenalties`.
2. **Text obsahových stránek** z v0 — je to přepis, ne vývoj, takže může běžet vedle.
3. **Hero fotka a GCS** — vizuál a média do provozuschopného stavu.
4. **Migrace + deploy.**
