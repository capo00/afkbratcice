# Migrace a nasazení

> Aktualizováno 2026-09-05: binární data jdou do **Google Cloud Storage**, ne na Google Drive;
> mizí `system-identity.json` a proměnná `GOOGLE_DISK_PUBLIC_FOLDER_ID`, přibývá
> `GCS_BUCKET_NAME`. Viz [README.md](./README.md), sekce 3.1 a 7.

> **Aktualizováno 2026-09-09: plná migrace je jen o zápasech.** Z v0 se převádí
> **rozlosování a výsledky** (a co k nim patří — týmy, sezóny, sestavy), a ukončené ročníky
> se při tom **vyhodnotí a uzavřou** (sekce 2.1). **Články ani fotogalerie se nemigrují**:
> obojí drží obsah v souborech na disku v0, ne v databázi, takže by to byla nejdelší
> a nejkřehčí část migrace kvůli obsahu, který dnes klub vydává jinde (novinky nově,
> fotky na Facebooku). Kroky 8–10 tím padají; mapování v sekcích 3.6–3.8 zůstává zapsané
> pro případ, že se to rozhodnutí otočí.

> **Aktualizováno 2026-09-07: MySQL dump je k dispozici** (`caio-share/d27814_afk.sql`)
> a proběhla z něj **částečná migrace sezóny 2026** — `tools/migrate-2026.js`. Není to
> etapa 11: bere jen jeden ročník (týmy, sezóny, zápasy, soupisku mužů, trenéra, články
> a konfiguraci), aby appka běžela na reálných datech místo na vymyšleném seedu. Historie,
> soubory ke stažení ani fotogalerie v ní nejsou. `migration_map` ale plní, takže na ni
> plná migrace naváže. Co se u toho ukázalo, je v sekci 6.1.

## 1. Zdroje dat

| Zdroj | Obsah | Poznámka |
|---|---|---|
| **MySQL (v0)** | `tym`, `hrac`, `trener`, `zapas`, `ucast`, `post`, `clanek`, `soubor`, `serial`, `pripona`, `fotogalerie` | Historická data od roku ~2005 |
| **MySQL (v0) – mimo rozsah** | `diskuze`, `prijem`, `pokuta`, `vydaj`, `zakazip` | Archivovat exportem, nemigrovat |
| **MongoDB (v1)** | `team`, `season`, `match`, `ecc_page`, `ecc_section`, `sys_binary`, `sys_identity`, `app` | Novější data, už ve správném tvaru |
| **Souborový systém (v0)** | `galerie/<datum>/*.jpg`, `galerie/hraci/<login>_1.jpg`, `reporty/*`, `soubory/*` | **Nemigruje se** (2026-09-09). Výjimkou jsou týmové fotky z `galerie/historie/teams/*` — ty už v repu jsou jako statika `client/public/assets/teams/`, ne v BinaryStore |

Přednost má **v1**: kde se záznam vyskytuje v obou zdrojích (týmy, novější sezóny
a zápasy), je zdrojem pravdy Mongo z v1 a MySQL doplňuje jen historii.

---

## 2. Postup

Migrace je jednorázová sada skriptů v `tools/migrate/`, spouštěná lokálně proti
cílové databázi. Vlastnosti:

- **Idempotence** – každý skript lze spustit opakovaně; už zmigrované záznamy přeskočí.
- **Mapovací kolekce `migration_map`** – `{ source: "mysql" | "mongo-v1", entity, legacyId, id }`.
  Slouží k rozpouštění cizích klíčů i k přesměrování starých URL (sekce 5).
- ~~**Dávkování** uploadů do GCS a **zmenšování při migraci**~~ – bezpředmětné od
  2026-09-09, kdy z rozsahu vypadly binárky, články i fotogalerie. Migrace zápasů sahá
  jen do Monga; jediná dlouhá operace je zápis ~2 500 zápasů.
- **Report** – každý krok vypíše počty `created / skipped / failed` a chyby do
  `tools/migrate/log/<krok>.jsonl`.

Pořadí kroků respektuje závislosti:

```
1. team          <- mongo-v1.team, mysql.tym
2. season        <- mongo-v1.season, dopočet z mysql.zapas (datum + vek)
3. person        <- mysql.hrac
4. player        <- mysql.hrac (tym, post, aktivni)
5. coach         <- mysql.trener
6. match         <- mongo-v1.match, mysql.zapas
7. match.playerList <- mysql.ucast (+ mysql.post)
8. uzavření sezón <- dopočet z výsledků (sekce 2.1)
9. appConfig     <- mongo-v1.app
```

**Mimo rozsah (2026-09-09):** binárky, články a fotogalerie — původní kroky 8, 9 a 10.
Padá s nimi i migrace fotek osob (`galerie/hraci/<login>_1.jpg`) a souborů ke stažení;
mapování zůstává popsané v sekcích 3.6–3.8, kdyby se to mělo vrátit. Důvod je u všech tří
stejný: obsah není v databázi, ale v souborech na disku v0 (sekce 6.1, bod 5), takže je to
nejdelší a nejkřehčí kus migrace — a zároveň jediný, který **nemá jednu jasnou pravdu**
(text článku je PHP fragment, u fotek nejde poznat album od náhledu). Novinky se píšou
v nové administraci od začátku, fotky vydává klub na Facebooku.

Co z toho plyne pro zbytek návrhu:

- **`logoUri` u týmů zůstává prázdné** a klient sáhne po klubovém erbu (to už umí).
- **ID-based přesměrování je jen pro zápasy.** `migration_map` bude mít `match`, takže
  `/informace-o-zapase-<n>` se přeloží; `/novinka-<n>` a `/fotogalerie-<n>` mapu mít nebudou
  a končí na seznamu (sekce 5).

---

### 2.1 Uzavření a vyhodnocení ukončených sezón

Rozhodnuto 2026-09-09. Historie je ~2 500 zápasů ve dvaceti ročnících, které **už nikdy
nikdo neupraví**. Migrovat je jako živá data by znamenalo, že web při každém zobrazení
tabulky z roku 2009 znovu čte celou sezónu a přepočítává ji z dat, o kterých se ví, že jsou
neúplná (chybějící zápasy, sloučené názvy týmů). Proto se ukončený ročník při migraci
**vyhodnotí jednou a uloží se výsledek**:

| Pole `season` | Význam |
|---|---|
| `state` | `open` (běžící, výchozí) / `closed` (dohráno a vyhodnoceno) |
| `finalTable` | konečná tabulka — pole řádků z `computeTable()`, včetně `rank` a názvu týmu |
| `closedAt` | kdy se sezóna uzavřela (kvůli dohledání, ne kvůli zobrazení) |

Sezóna se uzavírá, když **má vyplněné výsledky u všech zápasů s kolem** a její `yearFrom` je
starší než aktuální ročník. Uzavření dělá migrace pro historii a **administrace** pro sezóny,
které skončí za provozu (`season/close`, role z `CONTENT`); jde vzít zpět (`season/reopen`)
a tím se `finalTable` zahodí.

Proč uložený snímek, a ne dopočet:

- **Neúplná data se nesmí měnit sama.** Doplnit jeden chybějící zápas z roku 2011 by jinak
  potichu přepsalo pořadí celé sezóny. Se snímkem se to projeví jako rozdíl proti uložené
  tabulce, tedy něco, co je vidět.
- **Archiv se čte, ne počítá.** Tabulka ukončeného ročníku je jedno pole v jednom dokumentu
  místo dotazu na stovky zápasů. Tím taky odpadá stránkování v archivu.
- **Bodování se v čase mění.** `hasPenalties` platí pro dnešní soutěž; přepočet starých
  ročníků dnešním pravidlem by dal jiné pořadí, než jaké tehdy platilo.

Živá sezóna se **nikdy** nečte z `finalTable` — dokud je `state: "open"`, počítá se
tabulka pořád nad zápasy, jako dnes. Pro `state: "closed"` je uložená tabulka zdrojem pravdy;
`table/get` ji jen vrátí. Nesoulad mezi uloženou a dopočítanou tabulkou hlásí kontrola
v `npm run smoke`, ne uživatelské rozhraní.

**Zbývá potvrdit:** jestli ukončené sezóny mají zůstat v menu ročníků (a archiv je jen
jiná cesta ke stejné stránce), nebo mít vlastní obrazovku „Archiv".

---

## 3. Mapování polí

### 3.1 `tym` → `team`

| v0 | v2 | Transformace |
|---|---|---|
| `id` | – | do `migration_map` |
| `nazev` | `name` | |
| `vek` | `age` | `M→men`, `D→u18`, `Z→u14`, `S→old` — **potvrzeno** proti `team_age` v dumpu a proti webu v0 (2026-09-07) |
| `aktivni` | – | neaktivní týmy se migrují také (historické zápasy) |
| – | `own` | `true` pro `nazev = "AFK Bratčice"` |
| – | `logoId`, `logoUri` | doplní se ručně, v0 loga neměl |

### 3.2 `hrac` → `person` + `player`

| v0 | v2 | Transformace |
|---|---|---|
| `login` | – | klíč v `migration_map` (vazba z `ucast`, `trener`) |
| `heslo` | – | **nemigruje se** (SHA-1); uživatelé se registrují znovu přes Google |
| `jmeno` / `prijmeni` | `person.name` / `person.surname` | |
| `narozen` | `person.birthdate` | `DD.MM.YYYY` → `YYYY-MM-DD` |
| `telefon` / `mail` | `person.phone` / `person.email` | |
| `tym` | `player.teamList[0].id` | přes mapu týmů; `dateFrom` = neznámé → `null` |
| `post` | `player.position` | `post.zkratka` → `GK/DF/MF/FW` |
| `aktivni` | `player.teamList[0].dateTo` | `1` → `null`, jinak dnešní datum |
| `galerie/hraci/<login>_1.jpg` | `person.photoId` | ~~upload jako `type: "personPhoto"`~~ — **nemigruje se** (2026-09-09); fotky hráčů se nahrají v administraci |

### 3.3 `trener` → `coach`

`login` → `personId`, `tym` → `teamList[].id`, `od`/`do` → `dateFrom`/`dateTo`,
`role` = `headCoach` (v0 jinou roli nerozlišoval; výbor se doplní ručně jako `board`).

### 3.4 `zapas` → `match`

| v0 | v2 | Transformace |
|---|---|---|
| `kolo` | `round` | prázdné = přátelský zápas |
| `datum` | `time` | **Už je v UTC**, jen se doplní `Z` — viz sekce 6.1 |
| `hriste` | `place` | |
| `odjezd` | `departureTime` | |
| `idD` / `idH` | `homeTeamId` / `guestTeamId` | přes mapu týmů |
| `golyD` / `golyH` | `homeGoals` / `guestGoals` | |
| `golyDP` / `golyHP` | `homeGoalsHalf` / `guestGoalsHalf` | |
| `penalty` | `penaltyWinnerTeamId` | `id` týmu → nové `id`; `NULL` zůstává prázdné |
| `vek` + `datum` | `seasonId` | sezóna = rok s hranicí 1. 7.; pokud neexistuje, založí se |
| – | `state` | `played` když jsou vyplněné góly, jinak `planned` |

**Přátelské zápasy** (`kolo IS NULL`) dostanou technickou sezónu
`{ competition: "Přátelské zápasy", yearFrom, age }`, aby nezkreslily tabulku
(do tabulky vstupují jen zápasy s vyplněným `round` – shodně s v0).

### 3.5 `ucast` + `post` → `match.playerList`

| v0 | v2 |
|---|---|
| `hrac` | `playerId` (přes mapu osob → hráčů) |
| `role` | `position`; hodnota `STR` → `substitute: true` a `position` z `player.position` |
| `goly` | `goals` (`NULL` → `0`) |
| `zluta` / `cervena` | `yellowCard` / `redCard` (`1` → `true`, `NULL` → `false`) |

### 3.6 `clanek` → `article` + `ecc_page` + `ecc_section` — **mimo rozsah (2026-09-09)**

> Zapsané pro případ, že se rozhodnutí otočí. Pozor, tabulka níž je proti skutečnosti
> nepřesná: text ani titulní foto v dumpu nejsou (sekce 6.1, bod 5).


| v0 | v2 | Transformace |
|---|---|---|
| `nazev` | `name` | |
| `popis` | `ecc_section.uu5String` | text → odstavce; HTML entity se dekódují |
| `popis` (zkrácený) | `perex` | prvních ~300 znaků, oříznuto na hranici slova |
| `autor` | `author` | |
| `soubor` | `photographId` | soubor z `reporty/<soubor>` nahrát jako `articlePhoto` |
| `datum` | `publishTime` | |
| `zapas` | `matchId` | přes mapu zápasů |
| `priorita` | `priority` + `state` | `NULL`→`0/published`, `1`→`1/published`, `2`→`0/archived` |

### 3.7 `soubor` + `serial` → `sys_binary` — **mimo rozsah (2026-09-09)**


`nadpis` → `title`, `nazevSouboru` → soubor ze `soubory/`, `serial.zkratka` → `category`,
`datum` → `date`, `type: "document"`. Kategorie ze `serial` se zapíší do
`appConfig.fileCategoryList`.

### 3.8 `fotogalerie` → `gallery` — **mimo rozsah (2026-09-09)**


`nazev` → `name`, `datum` → `date`, `autor` → `author`, `pocet` → kontrola počtu
nahraných fotek. Fotky se čtou z `galerie/<YYYYMMDD>/<YYYYMMDD> (NN).jpg`
(legacy náhledy `m<...>` se **nepoužívají** – náhled `w400` si migrace vygeneruje sama
z plné verze, viz sekce 2).
Každá fotka se nahraje **dvakrát** – plná verze `w1600` (`type: "photo"`) a náhled `w400`
(`type: "photoThumb"`); plná si drží `thumbBinaryId` a `thumbUri`. První fotka alba se
nastaví jako `coverBinaryId` a její náhled jako `gallery.coverThumbUri`.
`gallery.category` se odvodí z názvu alba (fallback `club`) a potvrdí ručně.

Album `galerie/historie/teams/*` (týmové fotky) se migruje jako jedno album
`Týmové fotky` s `state: "published"`.

### 3.9 MongoDB v1 → v2

Kolekce `team`, `season`, `ecc_page`, `ecc_section`, `sys_binary`, `sys_identity`
se kopírují 1:1 (mění se jen `_id` → nová databáze zachovává původní `ObjectId`).

Kolekce `match` vyžaduje úpravu:

- `penalty` (pokud v datech existuje) → `penaltyWinnerTeamId`,
- doplnit `state` podle vyplněnosti skóre,
- `playerList` z v1 (pole `id`) → pole objektů `{ playerId, position, substitute, goals, yellowCard, redCard }`.

Kolekce `app` → `app_config` (přejmenování, struktura zůstává).

---

## 4. Indexy a integrita

Před spuštěním migrace se založí indexy z [data-model.md](./data-model.md).
Dvě upřesnění vyplývající z legacy dat:

1. **Unikátní index zápasu** `{ seasonId, homeTeamId, guestTeamId }` musí být
   **částečný** – jen pro dokumenty s vyplněným `round`:

   ```js
   createIndex(
     { seasonId: 1, homeTeamId: 1, guestTeamId: 1 },
     { unique: true, partialFilterExpression: { round: { $exists: true } } },
   );
   ```

   Jinak by dvě přátelská utkání stejné dvojice ve stejném roce zápis rozbila.

2. **Duplicity v `tym`** – v0 obsahuje týmy se stejným názvem v různém zápisu
   („Sokol Silůvky“ / „TJ Sokol Silůvky“). Migrace vypíše kandidáty na sloučení
   do reportu; sloučení potvrzuje člověk.

Kontroly po migraci:

- počet zápasů v sezóně odpovídá `teamList.length * (teamList.length - 1)`,
- žádný `match` nemá `homeTeamId === guestTeamId`,
- žádný `playerId` v `playerList` neukazuje mimo `player`,
- součet `goals` v `playerList` ≤ počet gólů týmu,
- tabulka spočítaná z v2 dat se pro poslední tři sezóny **shoduje** s výstupem
  v0 `cmd/controller/getTable.php` (regresní test bodování 3/2/1/0).

---

## 5. Přesměrování starých URL

Legacy web má ~90 pravidel v `.htaccess` a jeho URL jsou zaindexované.
Řeší se Express middlewarem `server/legacy-redirect.js` registrovaným **před** SPA
fallbackem; číselná ID se překládají přes `migration_map`.

| Staré URL | Nové URL | Typ |
|---|---|---|
| `/home`, `/home-<n>` | `/home` | 301 |
| `/historie` | `/page?code=history` | 301 |
| `/hymna` | `/page?code=hymn` | 301 |
| `/kontakt` | `/page?code=contact` | 301 |
| `/vybor` | `/page?code=board` | 301 |
| `/treninky` | `/page?code=training` | 301 |
| `/tymove_fotky` | `/gallery/detail?id=<idTýmovéFotky>` | 301 |
| `/muzi` | `/team?age=men` | 301 |
| `/zaci` | `/team?age=u14` | 301 |
| `/dorost` | `/team?age=u18` | 301 |
| `/stara-garda` | `/team?age=old` | 301 |
| `/zapasy`, `/zapasy-<n>` | `/team/matches` | 301 |
| `/vsechny-zapasy-muzi\|zaci\|dorost` | `/team/matches?age=...` | 301 |
| `/tabulka-muzi\|zaci\|dorost` | `/team/table?age=...` | 301 |
| `/informace-o-zapase-<n>` | `/match?id=<mapované>` | 301 |
| `/novinka-<n>` | `/novinky` (bez mapy — články se nemigrují, 2026-09-09) | 301 |
| `/fotogalerie` | `/gallery` | 301 |
| `/fotogalerie-<n>` | `/fotogalerie` (bez mapy — alba se nemigrují, 2026-09-09) | 301 |
| `/ke-stazeni` | `/files` | 301 |
| `/rss`, `/rss/` | `/rss` | 301 |
| `/prihlaseni` | `/login.html` (přihlašovací stránka z devkitu) | 302 |
| `/editace-*`, `/upravit-*`, `/novy-*`, `/smazat-*` | `/admin/...` | 302 |
| `/diskuze*` | `/home` | 301 |
| `/pokladna`, `/pokuty`, `/moje-pokuty`, `/prijem`, `/vydaj` | – | 410 Gone |
| `/api/<uc>` | – | 410 Gone (nové API má jiný kontrakt) |

Nepřeložitelné ID (záznam neexistuje v `migration_map`) končí na 404 stránce
s odkazem na odpovídající seznam.

---

## 6. Otázky k potvrzení před migrací

1. ~~**Mapování věkových kategorií**~~ – **potvrzeno 2026-09-07** (sekce 6.1).
2. ~~**Rozsah historie**~~ – **potvrzeno 2026-09-09**: migrují se **všechny sezóny**, ale
   **jen zápasy** (a co k nim patří). Ukončené ročníky se vyhodnotí a uzavřou (sekce 2.1);
   články ani fotogalerie do migrace nejdou. Argument o délce uploadu tím padá — bez fotek
   je celá migrace jen zápis do Monga.
3. **Účty hráčů** – hesla se nemigrují (v0 je má v SHA-1). Potvrdit komunikaci směrem
   k hráčům: registrace na `/login.html` přes Google, Facebook nebo e-mail a heslo,
   přiřazení role `members` správcem přes `admin/identities`.
4. **Osobní údaje** – v0 uchovává telefony a e-maily hráčů. Potvrdit, že se migrují,
   a že veřejná část je nezobrazuje (viz [api.md](./api.md), sekce 1.2).

### 6.1 Co se ukázalo při migraci sezóny 2026 (2026-09-07)

Pět věcí, které se z návrhu poznat nedaly, protože do té doby nebyl dump k dispozici.
Všechny jsou zapracované v `tools/migrate-2026.js` a platí i pro plnou migraci:

1. **`zapas.datum` je v dumpu UTC, ne v pražském čase.** Dump má v hlavičce
   `SET time_zone = "+00:00"` a MySQL `TIMESTAMP` konvertuje na výdej podle relace, takže
   hodnoty jsou už převedené. Původní pravidlo „Europe/Prague → UTC" by celý rozpis posunulo
   o dvě hodiny. Ověřeno proti webu v0: zápas s `15:00:00` v dumpu na v0 svítí jako 17:00.
2. **Kategorie sedí** (`M→men`, `D→u18`, `Z→u14`, `S→old`) — potvrzuje to číselník
   `team_age` přímo v dumpu (`M` = Muži, `D` = Dorost, `Z` = Žáci, `S` = Stará garda).
3. **`hrac.tym` nesmí sloužit jako soupiska mládeže.** Enum má jen `M/Z/S` (žádné `D`)
   a skupina `Z` jsou dnes pětadvacetiletí — je to zbytek žákovského týmu z let 2007–2013,
   který nikdo nepřeřadil. Kdo dnes hraje za dorost a žáky, v0 v `hrac` vůbec nemá; jediná
   stopa po nich jsou sestavy v `ucast`. Migrace 2026 proto zakládá jen soupisku mužů.
4. **Název soutěže v0 nikde není** — ani v databázi, ani na webu. Doplnil je klub
   (2026-09-07): muži **9. liga**, dorost **6. liga**, starší žáci **5. liga**. Migrace je
   proto hledá podle `{ yearFrom, age }`, ne podle celé trojice z unikátního indexu — jinak
   by přejmenování soutěže založilo druhou sezónu a zápasy by zůstaly viset na té staré.
5. **Text článku v dumpu vůbec není.** `clanek.popis` je perex (medián 192 znaků, maximum
   586) a vlastní text je PHP fragment `reporty/<soubor>.php`, který v0 includuje. Titulní
   foto je `galerie/clanky/other/<soubor>.webp`, ne `reporty/<soubor>`, jak čekala sekce 3.6.
   Platí to u **všech 345 článků** — a je to hlavní důvod, proč články z rozsahu migrace
   2026-09-09 vypadly úplně: potřebovaly by soubory z v0, ne jen
   databázi. Dokud v0 běží, jde tělo i fotku vytáhnout z webu — `migrate-2026.js --v0` to
   dělá a je to berlička, ne cílový stav.
   Perex se přitom z těla vyhazuje: v0 ho nemá jako pole, `popis` je ručně opsaná první věta
   článku, takže ve v2 (kde `desc` stojí nad obsahem) by ji čtenář dostal dvakrát.
6. **Řazení tabulky se od v0 liší, a je to záměr.** Čísla sedí přesně (ověřeno proti
   `tabulka-muzi` a `tabulka-zaci` na v0: 25 řádků, žádný rozdíl v zápasech, skóre ani
   bodech), ale při shodě bodů rozhoduje v2 podle
   [api.md](./api.md), 2.9 **vzájemný zápas**, kdežto v0 rozhoduje rozdílem skóre a týmy
   bez odehraného zápasu strká na konec. Projeví se to u dvou dvojic v tabulce mužů
   a u dvou týmů bez zápasu v žácích. Regresní test tabulky (etapa 12) tohle musí čekat,
   ne to hlásit jako chybu.

---

## 7. Prostředí a nasazení

### 7.1 Proměnné prostředí

`.env` leží vedle `package.json`; v režimu `NODE_ENV=development` se místo něj načte
`.env.development`. **Žádná proměnná není povinná** – server nastartuje i s prázdným
souborem a chybějící schopnosti se prostě nenabídnou (to je změna proti stavu z 2026-08-20,
viz [README.md](./README.md), riziko #7).

| Proměnná | Povinná | Popis |
|---|---|---|
| `NODE_ENV` | ne | `development` načte `.env.development`; ovlivňuje i cookie a Mongo SSL |
| `PORT` | ne | **`8081`** — jiný než propertyman (8080), aby šly obě appky pustit vedle sebe |
| `MONGODB_URI` | prakticky ano | bez ní server běží, ale všechny DB operace selžou |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ne | bez nich se Google přihlášení nenabídne |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | ne | totéž pro Facebook |
| `JWT_SECRET`, `JWT_LIFETIME` | ne | výchozí `GOOGLE_CLIENT_SECRET`, `1d` |
| `GCS_BUCKET_NAME` | prakticky ano | bucket pro binárky; bez ní `BinaryStore.isConfigured()` vrací `false` a `binary/*` se nezapnou |
| `GOOGLE_APPLICATION_CREDENTIALS` | ne | cesta ke klíči servisního účtu; **výchozí je ADC** |
| `BINARY_MAX_FILE_SIZE_MB` | ne | výchozí 25 |
| `BINARY_MAX_FILES` | ne | výchozí 20 souborů na request |

**Žádný `server/system-identity.json` už neexistuje.** GCS jede na Application Default
Credentials: lokálně `gcloud auth application-default login`, na App Engine servisní účet
instance. `GOOGLE_APPLICATION_CREDENTIALS` je jen volitelný override.

Pro `.env` a `.env.development` použít **různé buckety**, aby lokální vývoj nesáhl na
produkční soubory (postup v `caio-devkit/docs/how-to-set-gcs.md`).

### 7.2 Příkazy

| Příkaz | Popis |
|---|---|
| `npm run dev` | `caio-devkit start` – `nodemon server/index.js` + `vite build --watch` do `public/`. **Žádný Vite dev server ani HMR**; všechno jede přes serverový port (8081), po uložení je potřeba refresh. |
| `npm run build` | `caio-devkit build` – `vite build --outDir ../public`, rovnou do `public/` |
| `npm run deploy` | build + `gcloud app deploy` z rootu |

`app.yaml` obsahuje jediný řádek `runtime: nodejs24`.

Knihovny `caio-server`, `caio-ui` a `caio-devkit` nejsou v npm registry – appka je konzumuje
jako lokální tarbally (`file:../caio-architecture/…/dist/*.tgz`). Po změně v knihovně
nestačí `npm install`: verze se nemění, takže npm vezme balíček z cache. Je nutné
`rm -rf node_modules/<balíček> && npm install --no-save --force file:…tgz`.

### 7.3 Plán přepnutí

1. Nasadit v2 na dočasnou doménu (`https://<projekt>.appspot.com`) s produkční databází.
2. Spustit migraci, ověřit kontroly ze sekce 4.
3. Redakce zkontroluje obsah (články, galerie, soupisky) a doplní loga týmů.
4. Zmrazit zápisy do v0 (PHP web přepnout na read-only).
5. Doběh migrace delty (články a zápasy vzniklé mezitím).
6. Přesměrovat doménu na v2, zapnout `legacy-redirect`.
7. v0 ponechat 3 měsíce jako zálohu offline (databázový dump + archiv souborů).
