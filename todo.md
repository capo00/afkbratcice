# TODO — co zbývá do hotového webu

Stav k **2026-09-07**, větev `feature/caio`.

Zadání vlastní [`design/`](./design/) — tenhle soubor jen říká, **co z něj ještě není
udělané** a v jakém pořadí to dává smysl dělat. Když si odporují, vyhrává `design/`.

---

## Kde to stojí

| Vrstva | Hotovo | Chybí |
|---|---|---|
| Server | sportovní jádro (`team`, `season`, `match`, `person`, `player`, `coach`), **`article`**, statistiky a tabulka, galerie, `file/list`, konfigurace, iCal, sitemap, **`/rss`**, přihlášení z knihovny | ID-based přesměrování (čeká na migraci) |
| Klient — veřejná část | rám, 11 primitivů, self-hostovaná písma, **české adresy**, home vč. **aktualit**, **novinky a detail článku**, mužstva, soupiska, zápasy, tabulka, statistiky, detail zápasu, kolo, profil hráče, fotogalerie s lightboxem, obsahové stránky, kontakt, 404 | ke stažení, profil uživatele |
| Klient — administrace | rozcestník + **11 obrazovek** (týmy, sezóny, zápasy vč. výsledku a sestavy, osoby, hráči, trenéři, novinky, galerie, soubory, identity, konfigurace), **upload ověřený proti GCS** | filtrování dat podle `teamEditor:*` |
| Provoz | dev proti lokálnímu Mongu, **dev GCS bucket** | produkční GCS bucket, OAuth, SMTP, migrace, deploy |

Rozpad po obrazovkách je v [`design/frontend.md`](./design/frontend.md), sekce 12.

---

## 1. Obsah

### 1.1 Text obsahových stránek

Stránky **fungují** (`/historie`, `/hymna`, `/vybor`, `/treninky`, `/tymove-fotky`), ale
mají v `client/src/content/pages.js` jen kostry — **text se má přepsat z běžícího
`afkbratcice.cz`**. Historii klubu, jména výboru ani slova hymny si nevymýšlíme.

Entita `page` se **nedělá** a počká na ECC (viz [`README.md`](./design/README.md), sekce 2).
Časová osa historie už je `Uu5Bricks.VerticalTimeline` a jede — jen s roky bez textu.

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
- **Titulní foto článku** — server i `admin/articles` to umí a GCS je nastavené (5.1);
  proklikané zatím není.

---

## 3. Administrace — hotová (11 obrazovek)

Rozcestník `/admin` + jedenáct obrazovek; `admin/pages` **nevzniká**, protože obsahové
stránky jsou natvrdo v kódu a čekají na ECC. Seznam obrazovek, ikon a rolí drží
`client/src/admin/menu.js` — rozcestník, položka v liště i `withRoute` guard čtou totéž.

Ověřeno v prohlížeči včetně **založení článku proklikáním formuláře** (ne přes API).

Co zbývá dodělat uvnitř administrace:

- **Rozsahová role `teamEditor:*`** je v guardu (`admin/menu.js`), ale obrazovky ještě
  **nefiltrují data podle `UiAuth.getScopeList()`** — editor jednoho mužstva tak vidí
  v tabulce i cizí týmy. Server ho k zápisu nepustí (ověřeno smoke testem), takže je to
  UX, ne díra.
- **Týmová fotka a perex** (`team.desc`, `photoUri`, `photoDesc`) v `admin/teams` chybí,
  protože je nemá server (4.2).

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
| `GCS_BUCKET_NAME` v `.env` (produkce) | hotový je jen **dev** bucket `afkbratcice-binary-dev` (us-central1, Standard, uniform, `allUsers` = Storage Object Viewer, public access prevention vypnutá); produkční se založí u deploye |
| `GOOGLE_CLIENT_ID` / `SECRET`, `FACEBOOK_*` | přihlášení jen e-mailem a heslem |
| `SMTP_HOST`, `MAIL_FROM`, `APP_URL` | reset hesla se nenabízí (`passwordResetEnabled: false`) |

**Ověřeno 2026-09-07** proti dev bucketu: `binary/create|get|list|update|delete` z API i proklikáním
`admin/files` a hromadného uploadu fotek do alba; nahraná fotka se zobrazí na `/fotogalerie`.
Pozor na dvě věci, na které se přišlo až tímhle testem:

- **Bez kroku 4 návodu (`allUsers` + vypnutá public access prevention) upload projde, ale obrázky
  se nezobrazí** — klient je bere přímo z `storage.googleapis.com`, takže se to projeví až jako
  403 v `<img>`, ne jako chyba uploadu.
- **Smazaný nebo přejmenovaný soubor drží na svém uri starý obsah až hodinu**
  (`Cache-Control: public, max-age=3600` je výchozí u veřejných objektů). Týká se to i
  `Content-Disposition` po přejmenování — v metadatech objektu je nová hodnota hned, ale
  `storage.googleapis.com` chvíli vydává starou. Výměna obsahu tím netrpí, ta dělá nový
  `objectName`, a tedy i nové uri.

### 5.1.1 Chyby v `caio-server`, na které se přišlo při testu GCS — **opraveno 2026-09-07**

Obojí bylo v knihovně, ne v appce; podrobně v `caio-server/docs/binary.md`, páté kolo.
Appka má knihovnu přeinstalovanou z nového tarballu a obojí je ověřené proti dev bucketu.

- **`Content-Disposition` se do GCS nikdy nezapisoval.** `StorageAbl.create()` předával
  `contentDisposition` jako top-level option do `file.save()`, kde ho `@google-cloud/storage`
  beze slova zahodí — patří pod `metadata`. Soubor „Ke stažení" se tak stahoval pojmenovaný
  jako UUID. `setName()` tu chybu neměl.
- **`get` na neexistující ID vracelo 500 místo 404.** `dao.get()` vrátí u platného ID, které nic
  nenajde, `null` a `Crud._getData()` na něm padl na destrukturalizaci. Netýkalo se to jen
  binárek, ale všech entit.

### 5.2 Velikost `public/libs` po přidání Uu5Bricks

Závislosti jsou **hotové**: `uu5bricksg01` (časová osa historie) i `uu5codekitg01-forms@3.4.1`
(editace obsahu) jsou v `client/package.json` a do import mapy se dostanou samy. Časová osa
je ověřená v prohlížeči na `/historie`.

Zbývá rozhodnout o velikosti: `uu5bricksg01` přitáhl dalších 28 `uu*` balíčků a `public/libs`
narostlo na **~120 MB**. Největší kusy tenhle web nikdy nezobrazí —
`uu_uubmldraw_iconsg04` (51 MB, ikony BML diagramů) a starý `uu5codekitg01` (18 MB, kterému
se `caio-ui` už vyhnul). Vyřadit je jde přes `client/uu5-imports.json`, ale je to sázka:
když si o ně za běhu někdo řekne, spadne to až na té obrazovce. Řešit až u deploye.

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

1. ~~**GCS**~~ — dev bucket hotový a upload ověřený (5.1). Produkční bucket patří k deploy etapě.
2. **Text obsahových stránek** z v0 — je to přepis, ne vývoj, takže může běžet vedle.
3. **Zbytek veřejné části** — „Ke stažení", profil uživatele, SEO za běhu (kapitola 2).
4. **Hero fotka** — poslední kus vizuálu.
5. **Migrace + deploy.**
