# API

> Aktualizováno 2026-09-06 podle skutečného stavu `caio-server`
> (viz [README.md](./README.md), sekce 7).
>
> **Autorizaci vlastní [roles.md](./roles.md)** — sloupec „Auth“ níž odkazuje na množiny
> rolí definované tam. Když si dokumenty odporují, vyhrává `roles.md`.

## 1. Konvence

Server registruje use casy přes `App.init({ api })`; každý use case je klíč
v objektu `api` a hodnota `{ method, fn, auth, validator }`
(zpracovává `caio-server-app/services/command.js`).
`publicPath` se **nepředává** – resolvuje se z `process.cwd()`.

| Pravidlo | Popis |
|---|---|
| URL | `https://<host>/<useCase>`, např. `/match/list` |
| Metody | pouze `get` (čtení) a `post` (zápis) |
| `dtoIn` pro GET | query parametry; hodnota začínající `{` nebo `[` se automaticky projede `JSON.parse` |
| `dtoIn` pro POST | JSON tělo, u souborů `multipart/form-data` (na klientu to řeší `UiElements.Call.post` automaticky, když `dtoIn` obsahuje `File`) |
| `dtoOut` | vždy objekt; seznamy vrací `{ itemList, pageInfo }`. `fn` vracející `false` znamená „odpověď jsem poslal sám“ |
| Autorizace | `auth: true` = přihlášený, `auth: ["operatives", "authorities"]` = profily (stačí jeden), `auth: async ({ dtoIn, identity, req }) => boolean` = vlastní logika (jediná cesta k rozhodnutí podle `dtoIn`); bez `auth` je use case veřejný. Role a množiny: [roles.md](./roles.md) |
| Validace | `uu_appdatatypesg02@0.2.1` – `shape()` / `array()` a `validate()`, zabalené do funkce `({ dtoIn }) => dtoIn`; viz 1.0 |
| `sys` | API před zápisem odstraňuje `dtoIn.sys` (rezervovaný klíč v `Dao`) |
| Stránkování | `dtoIn.pageInfo = { pageSize, pageIndex }`, výchozí `pageSize` 1000; **`dtoOut` vrací `pageInfo` zpátky včetně `total`** |
| Health | `sys/health` registruje knihovna automaticky (`{ version }`); aplikace ho **přebíjí vlastním** klíčem – viz sekce 3 |

### 1.0 Validátory — `uu_appdatatypesg02`

Validuje se přes **`uu_appdatatypesg02`, verze `0.2.1`** (tranzitivní závislost `caio-server`).
Ověřeno proti nainstalovanému balíčku 2026-09-06.

Balíček **funguje**, jen má jiné API, než návrh původně předpokládal:

- **nemá default export** → výhradně pojmenované importy,
- **nemá `.exact()` ani `.arrayOf()`** → objekt se známými klíči je **`shape()`**,
  pole je **`array()`**,
- vrací 112 exportů, mimo jiné hotové `pageInfo`, `mongoId`, `id`, `date`, `datetime`,
  `uu5String`, `oneOf`, `code`, `email`, `uuIdentity`, `uuAppProfile`.

```js
import { shape, string, mongoId, oneOf, pageInfo } from "uu_appdatatypesg02";
import Config from "../config.js";

const matchListDtoIn = shape({
  seasonId: mongoId(),
  teamId: mongoId(),
  round: string(),
  state: oneOf(Config.MATCH_STATE),
  pageInfo: pageInfo(),
});

// validator dostane { dtoIn } a musí vrátit nové dtoIn
function validate(dataType) {
  return ({ dtoIn }) => {
    const { value, errors } = dataType.validate(dtoIn ?? {});
    if (errors.length) {
      const e = new Error("Invalid dtoIn");
      e.errors = errors;
      throw e;
    }
    return value;
  };
}

"match/list": { method: "get", validator: validate(matchListDtoIn), fn: … }
```

`dataType.validate(value)` vrací `{ value, errors, warnings }`:

| Situace | Kam spadne |
|---|---|
| chybí povinný klíč (`isRequired()`) | `errors` — `{ type: "missingKey", code: "isRequired.e001", path }` |
| špatný typ | `errors` — `{ type: "invalidType", code: "string.e001", path }` |
| **klíč navíc, který shape nezná** | **`warnings`** — `{ type: "unsupportedKey", code: "shape.w001" }` |

Klíč navíc je tedy jen varování, ne chyba. Sdílený `validate()` wrapper výše je proto
místo, kde se rozhodne, jestli se na varování hledí — doporučení je **logovat je, ale
nezamítat**, aby starý klient po nasazení nepřestal fungovat.

`validator` se volá jako `validator({ dtoIn }, "dtoIn")` a jeho návratová hodnota se použije
jako `dtoIn` — smí tedy i normalizovat. Wrapper i jednotlivé `DataType` definice patří do
`server/services/validators.js`.

> **Past u GET:** `caio-server` projede `JSON.parse` jen hodnoty začínající `{` nebo `[`,
> takže `?round=5` dorazí jako **string** `"5"`, ne číslo. Skalární čísla proto validovat
> jako `string()` a přetypovat, nebo je posílat zabalené v objektu
> (`?pageInfo={"pageSize":10}` — tam už `pageInfo()` dostane skutečná čísla).

> **Pozor na komentáře v `caio-server`.** `binary-api.js` i `identity-api.js` mají u ručních
> validátorů poznámku, že balíček „nefunguje“. Platí z ní jen ta část o chybějícím default
> exportu a `.exact()`/`.arrayOf()`; správná jména jsou `shape()` a `array()`. Knihovní use
> casy zůstávají na ručních funkcích, aplikace je psát tak nemusí.

#### 1.0.1 `pageInfo` v `dtoOut` je změna v `caio-server`

`Dao.find` vrací holé pole a `Crud.list` z něj dělá `{ itemList }` — **nikde v knihovně
`pageInfo` zpátky nechodí**. Klient ho přitom potřebuje: `UiElements.Crud` volá
`handlerMap.loadNext({ pageInfo: { pageIndex } })` a `useDataList` bez `total` neví, kdy
přestat. Bez toho nejde stránkovat novinky ani dotahovat fotky v albu.

Doplní se **v `caio-server`**, ne v aplikaci (rozhodnuto 2026-09-06) — je to vlastnost
každého seznamu na tomhle stacku, ne afkbratcice:

- `Dao.find` vrátí `{ itemList, pageInfo: { pageIndex, pageSize, total } }`; `total`
  z `countDocuments` nad stejným filtrem,
- `Crud.list` a všechny `*/list` use casy tvar jen propouštějí dál,
- týká se i `caio_propertyman` — tam se to musí ověřit, ne jen nasadit.

### 1.1 Chyby

Chyby vychází z `Error` (`caio-server`). Tvar odpovědi:

```json
{
  "message": "Object match does not exist",
  "code": "afkbratcice/match/doesNotExist",
  "paramMap": { "id": "..." },
  "dtoOut": {},
  "cause": {}
}
```

| Situace | HTTP | Tělo |
|---|---|---|
| Nenalezeno | 404 | `code: <prefix>/<entity>/doesNotExist` |
| Selhání CRUD | 500 | `code: <prefix>/<entity>/{create,update,delete,createMany,deleteMany}Failed` |
| Chyba validace | 400 | `{ message: "Validator exception", error }` |
| Nepřihlášen / bez oprávnění | 401 | `{ error: { code: "unauthorized", message, data: { identity, profileList } } }` |
| Neočekávaná chyba | 500 | `{ message: "Unexpected exception", error }` |
| Příliš velký upload | 413 | `code: caio-server-binarystore/payloadTooLarge` |

Prefix chybových kódů aplikace: `afkbratcice`. Knihovní chyby si nesou vlastní prefix
(`caio-server/...`, `caio-server-dao/...`, `caio-server-auth/...`,
`caio-server-binarystore/...`).

Pozor na nesourodost: `Error.toObject()` vrací pole na kořeni, kdežto 401 z autorizace
je zabalené do `error`. Klient musí umět obojí.

### 1.2 Ochrana osobních údajů

`person`, `player` a `coach` vrací kontaktní údaje (`birthdate`, `email`, `phone`)
pouze volajícímu s rolí z množiny `CONTENT`, nebo osobě samotné
(`person.identity === identity.identity`). Pro ostatní je ABL z `dtoOut` odstraňuje –
stejným způsobem, jako to dělá `Identity._getPublicData` v `caio-server-auth`.

**Jména mládeže odstraňuje server, ne klient** (rozhodnuto 2026-09-06). `appConfig.hideNamesAgeList`
původně jen říkalo klientovi, aby jméno nevykreslil — jenže pak jsou jména dětí pořád
v odpovědi API a stačí otevřít network tab. Filtr proto patří do stejné vrstvy jako
kontakty a `departureTime`: `player`/`coach` u týmu, jehož `age` je v `hideNamesAgeList`,
vrací `person` bez `name` a `surname` každému bez role z `CONTENT` (a mimo `self`).
Týká se to i sestavy v `match/get` a řádků ve `stats/listPlayerStats` — jinak by filtr
šlo obejít druhým endpointem. Klient místo jména ukazuje číslo dresu a post.

---

## 2. Přehled use casů

Legenda: **–** veřejné · **A** jakýkoli přihlášený · **TE** `teamEditor:<teamId>`
(role s rozsahem) · velká písmena = množiny rolí z [roles.md](./roles.md), sekce 4:

| Množina | Obsahuje |
|---|---|
| `ADMIN` | `authorities` |
| `CONTENT` | `operatives` + ADMIN |
| `MATCH` | `matchEditor` + CONTENT |
| `NEWS` | `newsEditor` + CONTENT |
| `GALLERY` | `galleryEditor` + CONTENT |
| `PAGES` | `contentEditor` + CONTENT |
| `MEMBER` | `members` + CONTENT |

Binárky se autorizují **podle kolekce**, ne rolí z téhle tabulky — viz sekce 2.11.

Kde je u zápisového use casu navíc **TE**, smí ho volat i editor konkrétního týmu —
rozsah a jeho úskalí jsou v [roles.md](./roles.md), sekce 3.

### 2.1 `team`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `team/list` | get | – | `{ age, idList, own, pageInfo }` | `{ itemList }` |
| `team/get` | get | – | `{ id }` | `team` |
| `team/create` | post | CONTENT | `{ name, shortName, age, own, desc, logo: File, photo: File, photoDesc }` | `team` |
| `team/update` | post | CONTENT, **TE** | `{ id, name, shortName, age, own, desc, logo: File \| null, photo: File \| null, photoDesc }` | `team` |
| `team/delete` | post | CONTENT | `{ id }` | `{}` |

Práce s logem se přebírá z v1 `team-abl.js`: `create` nahraje binárku a uloží
`logoId` + `logoUri`, `update` s `logo: null` binárku smaže, `delete` smaže i logo.
Při selhání zápisu se nahraná binárka uklidí (kompenzace).

**Týmová fotka** (`photo` / `photoUri` / `photoDesc`) jede úplně stejnou cestou, jen do
`sys_binary` s `type: "photo"` místo `"logo"` — z toho se skládá karta v přehledu mužstev
(viz [frontend.md](./frontend.md), 3.3). Doporučená šířka 1200 px. U soupeřů zůstává prázdná.

`desc` je **perex mužstva**, `photoDesc` **popisek pod fotkou** — dvě různé věci, dvě pole.
Perex se v celém modelu jmenuje `desc` (`page.desc`, `season.desc`), takže tady taky.

### 2.2 `season`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `season/list` | get | – | `{ age, teamId, yearFrom, idList, pageInfo }` | `{ itemList }` |
| `season/get` | get | – | `{ id }` | `season` |
| `season/getCurrent` | get | – | `{ age }` nebo `{ teamId }` | `season \| {}` |
| `season/listCurrent` | get | – | `{ yearFrom }` (výchozí aktuální ročník) | `{ itemList }` – **kategorie klubu pro daný ročník** |
| `season/listYears` | get | – | `{}` | `{ itemList }` – ročníky, pro které existují data (přepínač sezóny) |
| `season/create` | post | CONTENT | `{ competition, yearFrom, age, desc, teamList }` | `season` |
| `season/update` | post | CONTENT | `{ id, ... }` | `season` |
| `season/delete` | post | CONTENT | `{ id }` | `{}` |

`season/delete` odmítne smazání, pokud na sezónu existují zápasy
(`afkbratcice/season/hasMatches`, HTTP 400) – ochrana proti osiřelým `match`.

`idList` je **doplněk proti dávce ze 6. 9.**: `stats/getPlayerStats` vrací `bySeasonList`
jen se `seasonId`, takže profil hráče potřebuje sezóny dopojmenovat. Bez `idList` by musel
načíst všechny sezóny klubu jen kvůli pěti řádkům.

**`season/listCurrent` je zdroj kategorií.** Kategorie mužstev se mění sezónu od sezóny,
takže nikde nejsou vyjmenované – odvozují se z dat. Vrací jednu položku na každou sezónu
daného ročníku, v jejímž `teamList` je tým s `own: true`:

```json
{ "itemList": [
  { "seasonId": "…", "age": "men", "competition": "III. třída sk. A",
    "teamId": "…", "teamName": "AFK Bratčice", "hasTable": true }
]}
```

Z toho si klient staví menu i routy (viz [frontend.md](./frontend.md), sekce 2.5).
`hasTable` je `false` u soutěží bez tabulky (stará garda), aby se položka *Tabulka*
v menu vůbec neobjevila. Řazení podle `appConfig.categoryOrder`, neznámé kódy na konec.

### 2.3 `match`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `match/list` | get | – | `{ seasonId, teamId, teamIdList, opponentId, playerId, round, state, dateFrom, dateTo, order, pageInfo }` | `{ itemList }` |
| `match/get` | get | – | `{ id }` | `match` + `homeTeam`, `guestTeam`, `season`, `playerList` s osobami |
| `match/getLast` | get | – | `{ teamId }` | `match \| {}` |
| `match/getNext` | get | – | `{ teamId }` | `match \| {}` |
| `match/create` | post | MATCH, **TE** | `match` bez `id` | `match` |
| `match/createMany` | post | MATCH | `{ itemList }` | `{ itemList }` |
| `match/update` | post | MATCH, **TE** | `{ id, ... }` | `match` |
| `match/setResult` | post | MATCH, **TE** | `{ id, homeGoals, guestGoals, homeGoalsHalf, guestGoalsHalf, penaltyWinnerTeamId }` | `match` |
| `match/setLineup` | post | MATCH, **TE** | `{ id, playerList }` | `match` |
| `match/delete` | post | MATCH | `{ id }` | `{}` |
| `match/deleteMany` | post | MATCH | `{ idList }` | `{}` |

Pravidla:

- `match/list` s `teamId` hledá `$or: [{ homeTeamId }, { guestTeamId }]` (z v1).
- `departureTime` se ve veřejném `dtoOut` vrací jen roli `members` a výš.
- `setResult` dopočítá `state: "played"` a ověří, že `penaltyWinnerTeamId` je jeden
  ze zúčastněných týmů a že se současně rovná `homeGoals === guestGoals`
  (`afkbratcice/match/invalidPenaltyWinner`).
- `setLineup` ověří, že hráči patří do některého z týmů zápasu, a že součet `goals`
  nepřevyšuje počet gólů týmu (varování, ne chyba – vlastní góly).
- `createMany` je určeno pro hromadný import rozlosování (viz [frontend.md](./frontend.md), sekce 6.3).

**Jeden `match/list` místo tří use casů.** Původní návrh měl vedle sebe `listRound`,
`listProgram` a `listHeadToHead`. Všechny tři jsou ale jen jiné filtry nad stejnou kolekcí,
takže se skládají z parametrů `match/list`:

| Pohled | Volání |
|---|---|
| Zápasy týmu v sezóně | `{ teamId, seasonId }` |
| Kolo v soutěži | `{ seasonId, round }` |
| Program víkendu napříč kategoriemi | `{ teamIdList: [...], dateFrom, dateTo }` |
| Vzájemné zápasy (H2H) | `{ teamId, opponentId, state: "played", order: "desc", pageInfo }` |
| Rozpis / výsledky | `{ teamId, seasonId, state }` + `order` |
| Zápasy hráče (profil) | `{ playerId, order: "desc", pageInfo }` |

Sémantika filtrů:

- `teamId` – tým je domácí **nebo** hostující (`$or`).
- `teamIdList` – kterýkoli z uvedených týmů (`$in` nad oběma poli). Program víkendu si
  seznam vlastních týmů vezme ze `season/listCurrent`, takže server nemusí nic tušit
  o tom, co je „naše“.
- `opponentId` – **jen spolu s `teamId`**; zúží na dvojici, tedy H2H. Sám o sobě se chová
  jako `teamId`.
- `playerId` – zápasy, v jejichž sestavě hráč je (`playerList.playerId`). **Doplněk proti
  dávce ze 6. 9.**: index `{ "playerList.playerId": 1 }` v `match/dao.js` existuje, ale
  filtr v `listByFilter` ne, takže blok „poslední zápasy" na profilu hráče neměl odkud brát.
- `dateFrom` / `dateTo` – rozsah nad `time`, včetně hranic. Prázdný `time` (termín neurčen)
  do rozsahu nespadá.
- `order` – `"asc"` (výchozí, rozpis) nebo `"desc"` (výsledky).

Server tedy nemá žádný use case, který by „věděl“, co je víkend nebo co je náš tým — obojí
si určuje klient. Kdyby se ukázalo, že program víkendu potřebuje víc dotazů, než je zdrávo,
je to důvod přidat agregaci, ne teď dopředu.

**Validátor `match/list`** – definice je v sekci 1.0.

### 2.4 `stats` (počítané)

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `stats/getTable` | get | – | `{ seasonId }` nebo `{ teamId }` | `{ table: [...] }` |
| `stats/listPlayerStats` | get | – | `{ seasonId, teamId }` | `{ itemList }` |
| `stats/getPlayerStats` | get | – | `{ playerId, seasonId }` | `{ total, bySeasonList }` |

**Řádek tabulky**

```
{ team, played, wins, penaltyWins, penaltyLosses, losses, draws,
  goalsFor, goalsAgainst, goalDifference, points }
```

**Výpočet bodů** (dle v0 `cmd/controller/getTable.php`):

| Výsledek | Body |
|---|---|
| výhra v normální hrací době | 3 |
| výhra na penalty (`penaltyWinnerTeamId` = tým) | 2 |
| prohra na penalty | 1 |
| prohra | 0 |
| remíza bez rozstřelu (soutěže bez penalt) | 1 |

Řazení: `points` → vzájemné zápasy → `goalDifference` → `goalsFor` → název týmu.
Do tabulky vstupují jen zápasy s vyplněnými oběma skóre a s vyplněným `round`
(vylučuje přátelské zápasy) – shodně s v0.

**Statistika hráče**: agregace přes `match.playerList` –
`{ playerId, person, appearances, goals, yellowCards, redCards, minutesShare }`.
Implementace přes aggregation pipeline (`$unwind: "$playerList"`), ne v paměti;
`Dao` pro to dostane doplňkovou metodu `aggregate` v `MatchDao`.

### 2.5 `person`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `person/list` | get | – | `{ query, idList, pageInfo }` | `{ itemList }` (bez kontaktů, viz 1.2) |
| `person/get` | get | – | `{ id }` | `person` |
| `person/create` | post | CONTENT, **TE** | `{ name, surname, birthdate, email, phone, identity, photo: File }` | `person` |
| `person/update` | post | CONTENT | `{ id, ... }` | `person` |
| `person/delete` | post | CONTENT | `{ id }` | `{}` |
| `person/linkIdentity` | post | ADMIN | `{ id, identity }` | `person` |
| `person/linkSelf` | post | A | `{}` | `{ linked, personId? }` |

`person/delete` odmítne smazání, pokud existuje navázaný `player` nebo `coach`.

#### 2.5.1 Automatické spárování osoby s identitou

**Rozhodnuto 2026-09-06:** hráč se po přihlášení spáruje se svým `person` záznamem
**automaticky podle ověřeného e-mailu**, bez potvrzování správcem. Odemyká to vlastní
kontaktní údaje a profil, takže na tom záleží — pravidla jsou proto úzká.

`person/linkSelf` (`auth: true`) spáruje, a jen když platí **všechno**:

1. `identity.email` je vyplněný,
2. **e-mail někdo ověřil** — `identity.authMethodList` obsahuje jiný způsob než `password`,
   tedy účet má `googleId` nebo `facebookId` a provider za adresu ručí. Samotná registrace
   heslem nestačí: kdokoli by se zaregistroval na hráčův e-mail a dostal jeho záznam,
3. právě jedna `person` má ten e-mail a **ještě nemá `identity`**.

Nesplněná podmínka **není chyba** — vrací se `{ linked: false }` a nic se neděje. Je to
vedlejší krok při přihlášení, ne operace, kterou si uživatel vyžádal.

- **„Právě jedna" řeší rodinnou schránku.** U mládeže mívá víc sourozenců e-mail rodiče;
  při dvou shodách se nepáruje nic a zbývá ruční `person/linkIdentity`.
- **Volá to klient jednou po přihlášení** (z `core/app-context.jsx`, který stejně běží při
  startu SPA), ne middleware u každého requestu — párovací dotaz nemá smysl dělat pořád.
  Je idempotentní, takže na opakovaném volání nezáleží.
- **`authMethodList` je v JWT** (`Identity.getBasicData`), takže si appka nemusí sahat do
  `sys_identity`. Knihovna ho ale popisuje jako údaj „pro UI, ne pro autorizaci" — tady
  se používá k rozhodnutí, na kterém záleží. Je odvozený přímo z `googleId`/`facebookId`,
  takže je to bezpečné, ale kdyby `caio-server-auth` někdy začal seznam plnit jinak, tohle
  místo se musí zkontrolovat. Čistší by bylo, aby knihovna appce zpřístupnila `Identity.get`.

### 2.6 `player`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `player/list` | get | – | `{ teamId, active, idList, pageInfo }` | `{ itemList }` (s vloženou `person`) |
| `player/get` | get | – | `{ id }` | `player` + `person` + statistiky |
| `player/create` | post | CONTENT, **TE** | `{ personId, position, number, teamList }` | `player` |
| `player/update` | post | CONTENT, **TE** | `{ id, ... }` | `player` |
| `player/addTeam` | post | CONTENT, **TE** | `{ id, teamId, dateFrom }` | `player` |
| `player/endTeam` | post | CONTENT, **TE** | `{ id, teamId, dateTo }` | `player` |
| `player/delete` | post | CONTENT | `{ id }` | `{}` |

`active: true` filtruje hráče s otevřeným členstvím (`dateTo: null` nebo v budoucnu).

### 2.7 `coach`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `coach/list` | get | – | `{ teamId, role, active, pageInfo }` | `{ itemList }` (s vloženou `person`) |
| `coach/get` | get | – | `{ id }` | `coach` + `person` |
| `coach/create` | post | CONTENT, **TE** | `{ personId, role, teamList }` | `coach` |
| `coach/update` | post | CONTENT, **TE** | `{ id, ... }` | `coach` |
| `coach/delete` | post | CONTENT, **TE** | `{ id }` | `{}` |

### 2.8 `article`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `article/list` | get | – | `{ state, matchId, tag, pageInfo }` | `{ itemList, pageInfo }` – **bez `content`** |
| `article/get` | get | – | `{ id }` | `article` včetně `content` (+ `match`, pokud je navázán) |
| `article/create` | post | NEWS | `{ name, perex, content, author, matchId, priority, publishTime, photograph: File }` | `article` |
| `article/update` | post | NEWS | `{ id, ... , photograph: File \| null }` | `article` |
| `article/setState` | post | NEWS | `{ id, state }` | `article` |
| `article/delete` | post | NEWS | `{ id }` | `{}` |

- **Obsah je pole `content` typu `uu5String`** (rozhodnuto 2026-09-06), ne vazba na ECC
  stránku. Edituje se zatím **jako kód**, ne WYSIWYG — `uu5codekitg01` nad textovým polem
  ve formuláři článku. Rich-text přijde s ECC; datový model se kvůli tomu měnit nebude,
  migrace je „vytvoř stránku s jednou sekcí z `content`".
- `article/list` `content` **nevrací** — výpis novinek potřebuje perex, ne celé texty;
  u dvaceti článků by to byl řádově větší přenos zadarmo.
- `article/delete` maže i titulní fotku.
- `article/list` bez `state` vrací pro nepřihlášené jen `state: "published"`
  a `publishTime <= nyní`.
- Řazení: `priority` DESC, `publishTime` DESC (shodně s v0 `index.php`).

### 2.9 `page` (obsahové stránky)

> **Nahrazuje `eccPage` / `eccSection` (rozhodnuto 2026-09-06).** ECC v `caio-server` není
> a jeho design se ladí samostatně. Obsahové stránky na něj čekat nemusí — potřebují jednu
> věc: kus `uu5String`, který jde uložit a změnit. `UiEcc` se tedy zatím **nepoužívá vůbec**.

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `page/get` | get | – | `{ code }` nebo `{ id }` | `page` včetně `sectionList` |
| `page/list` | get | PAGES | `{ pageInfo }` | `{ itemList, pageInfo }` – **bez `sectionList`** |
| `page/create` | post | PAGES | `{ code, name, desc, sectionList }` | `page` |
| `page/update` | post | PAGES | `{ id, code, name, desc, sectionList }` | `page` |
| `page/delete` | post | PAGES | `{ id }` | `{}` |

**Tvar stránky:**

```json
{
  "id": "…", "code": "history", "name": "Historie klubu",
  "desc": "Od založení v roce 1932 po dnešek.",
  "sectionList": [
    { "content": "<uu5string/>Skupina nadšenců zakládá…" },
    { "content": "<uu5string/><Uu5Bricks.VerticalTimeline>…</Uu5Bricks.VerticalTimeline>" }
  ]
}
```

- **`sectionList` je pole objektů, ne pole `id`.** Sekce jsou vložené v dokumentu stránky
  a čtou i zapisují se s ní — žádné `eccSection/list`, žádné zámky. Objekt má zatím jediný
  klíč `content`; je to objekt proto, aby k němu šlo přidat nadpis, kotvu nebo variantu
  podkladu **bez migrace**. Pořadí v poli je pořadí vykreslení.
- **`page/update` posílá `sectionList` celý**, ne po sekcích. Stránku edituje jeden člověk
  v jednom modalu, takže se ukládá jako celek — přírůstkové `createSectionBefore/After`
  a `updateSectionOrder` z ECC kontraktu odpadají.
- **`desc` je perex**, samostatné pole, ne první sekce. Výpis stránek a meta tagy potřebují
  text, který nechtějí parsovat z `uu5String`.
- **`page/get` bere `code`**, ne jen `id` — routa je `/page?code=history` a klient nemá
  proč znát `id`. Odpadá tím i překlad `code → id`, kvůli kterému byl v původním návrhu
  `eccPage/getByCode` (riziko #12 padá i s ním).
- `code` je unikátní a **z pevného číselníku** (`history`, `hymn`, `contact`, `board`,
  `training`, `team-photos`) — na ty kódy míří `server/legacy-redirect.js`, takže překlep
  v administraci = rozbité přesměrování ze starého webu. Neznámý `code` je 404
  `afkbratcice/page/notFound`.
- Autorizace je **PAGES pro všechny zápisy**. Odpadá tím rozlišování „čí je stránka",
  kvůli kterému měly ECC sekce vlastní `auth` funkci (`newsEditor` nesměl přepsat hymnu):
  články a stránky jsou teď dvě různé entity se dvěma různými rolemi, takže se to řeší samo.
- Editace je **v kódu, ne WYSIWYG** — `uu5codekitg01` nad `content` každé sekce.
- Žádné zámky ani revize. Šest stránek a jeden kronikář; osmihodinový lock by tu neřešil
  nic, co se reálně děje.

> **Cesta k ECC.** `sectionList` je přesně jednotka, se kterou ECC pracuje. Až modul vznikne,
> každý objekt se stane dokumentem `ecc_section` a v `page` zbude pole `id` — migrace je
> rozpad pole na dokumenty, ne změna tvaru obsahu.

### 2.10 `gallery`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `gallery/list` | get | – | `{ state, seasonId, matchId, pageInfo }` | `{ itemList }` |
| `gallery/get` | get | – | `{ id }` | `gallery` |
| `gallery/listPhotos` | get | – | `{ id, pageInfo }` | `{ itemList }` (binárky alba) |
| `gallery/create` | post | GALLERY | `{ name, date, author, seasonId, matchId }` | `gallery` |
| `gallery/update` | post | GALLERY | `{ id, ... , coverBinaryId }` | `gallery` |
| `gallery/addPhoto` | post | GALLERY | `{ id, file: File, thumb: File, name }` | `{ binary, thumbBinary }` |
| `gallery/deletePhoto` | post | GALLERY | `{ id, binaryId }` | `{}` |
| `gallery/delete` | post | GALLERY | `{ id }` | `{}` |

- `addPhoto` přijímá **dva soubory**: plnou verzi (`w1600`) a náhled (`w400`) – oboje zmenšené
  na klientu, protože Google Cloud Storage náhledy negeneruje
  (viz [README.md](./README.md), sekce 3.1). Uloží obě binárky a do plné doplní
  `thumbBinaryId` + `thumbUri`.
- `addPhoto`/`deletePhoto` udržují `gallery.photoCount`; `deletePhoto` maže i náhled.
- `gallery/delete` smaže všechny binárky s `refId = galleryId` (plné i náhledy).
- Hromadný upload se na klientu řeší sekvenčním voláním `gallery/addPhoto` s ukazatelem
  průběhu – ne kvůli kvótám (GCS je nemá jako Drive), ale kvůli limitům requestu
  `BINARY_MAX_FILE_SIZE_MB` (25) a `BINARY_MAX_FILES` (20).
- `gallery/listPhotos` vrací plné binárky včetně `thumbUri`, takže mřížka nepotřebuje
  druhý dotaz.

### 2.11 `binary` a `file`

> **Změna v `caio-server` k implementaci.** Dnešní `BinaryStore.createApi()` bere **jednu**
> konfiguraci auth pro všechny binárky. To nestačí: fotograf nahrávající do galerie nemá mít
> možnost přepsat logo klubu. Níž je návrh **kolekcí** — pojmenovaných jmenných prostorů,
> každý s vlastní autorizací. Souvislosti a rozpis kolekcí tohoto webu:
> [roles.md](./roles.md), sekce 5.1.

#### Kolekce

Každá binárka patří do právě jedné kolekce. `collection` je **první třídy pole**, ne
aplikační přílepek — knihovna podle něj autorizuje i filtruje.

```js
...(BinaryStore.isConfigured() ? BinaryStore.createApi({
  collectionMap: {
    sys:     { write: { profileList: Config.CONTENT } },
    team:    { write: { authorize: teamScopedBinary } },
    person:  { write: { authorize: teamScopedBinary } },
    article: { write: { profileList: Config.NEWS } },
    gallery: { write: { profileList: Config.GALLERY } },
    page:    { write: { profileList: Config.PAGES } },
    file:    { write: { profileList: Config.PAGES } },
  },
}) : {}),
```

Konfigurace jedné kolekce:

| Klíč | Význam |
|---|---|
| `read` | auth pro `list` a `get`; vynecháno = veřejné |
| `write` | auth pro `create`, `update`, `delete`, `deleteMany` |
| `create`, `update`, `delete`, `deleteMany`, `list`, `get` | jemnější přebití jednotlivé operace; má přednost před `read`/`write` |

Hodnota kterékoli z nich: `true` (stačí přihlášení), `{ profileList: [...] }`,
`{ identityList: [...] }` (konkrétní lidé bez ohledu na role), nebo
`{ authorize: async ({ dtoIn, identity, req, binary }) => boolean }`. `binary` je načtený
záznam u operací nad existujícím souborem, jinak `undefined`.

#### Odkud se kolekce bere

| Operace | Zdroj kolekce |
|---|---|
| `create` | `dtoIn.collection` — **povinné**; neznámá hodnota → 400 `caio-server-binarystore/unknownCollection` |
| `list` | `dtoIn.collection` — povinné, seznam je jím filtrovaný |
| `get`, `update`, `delete` | **ze záznamu**, dohledaného podle `dtoIn.id` |
| `deleteMany` | ze záznamů; **musí projít všechny**, jinak 401 a nemaže se nic |

U operací nad existujícím souborem se kolekce **nikdy nebere z `dtoIn`** — jinak by si ji
volající nalhal. Autorizační funkce si proto záznam načte sama, ještě než rozhodne
(`auth` dostává jen `dtoIn`). Je to jeden dotaz navíc na zápisovou operaci.

#### Use casy

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `binary/list` | get | dle kolekce | `{ collection, refId, idList, pageInfo }` | `{ itemList }` |
| `binary/get` | get | dle kolekce | `{ id }` | `binary` |
| `binary/create` | post | dle kolekce | `{ collection, refId, file: File, name, ...vlastní pole }` | `binary` |
| `binary/update` | post | dle kolekce | `{ id, file: File, name, ... }` | `binary` |
| `binary/delete` | post | dle kolekce | `{ id }` | `{}` |
| `binary/deleteMany` | post | dle kolekce | `{ idList }` | `{}` |
| `file/list` | get | – | `{ category, pageInfo }` | `{ itemList }` — **aplikace** |

**Filtrování.** `binary/list` nově umí `collection` a `refId` — obojí jsou pole vlastněná
knihovnou, takže je bezpečné je vystavit. Tím padá většina původní potřeby vlastního
`Dao("sys_binary")`: fotky alba jsou `{ collection: "gallery", refId: galleryId }`.
Aplikaci zůstává jen `file/list`, protože filtruje podle `category`, což je **její** pole —
libovolné aplikační filtry se do knihovny nepouští.

**Vlastní pole.** `BinaryAbl.create` dál propouští neznámá pole do DAO (`...restParams`),
takže `title`, `category`, `date` fungují beze změny.

`binary.uri` je veřejná adresa objektu v bucketu a **vrací se i v `list`/`get`**. Každá změna
obsahu přes `update` vytvoří nový objekt → nové `uri`, takže cache nikdy neservíruje starou
verzi. Interní `objectName` se z `dtoOut` odstraňuje.

> **Kolekce chrání API, ne bytes.** Objekty v GCS jsou veřejné na svém `uri`. Kdo URL zná,
> soubor stáhne bez ohledu na kolekci. Pro tenhle web to nevadí — všechno nahrané je stejně
> veřejné. Skutečně neveřejná kolekce by potřebovala privátní objekty a podepsané URL,
> což `BinaryStore` neumí.

**Soubory ke stažení nejsou holá `BinaryCrud`.** `UiElements.BinaryCrud` už kolekci umí
(`collection="file"`, doplněno v `caio-ui` 6. 9.), ale je záměrně **nerozšiřitelná přes
props** — a `file/list` filtruje podle `category` a řadí podle `date`, což jsou pole, která
by tak nikdo nezapsal a veřejná stránka „Ke stažení" by zůstala nesekcovaná. `admin/files`
si proto skládá **vlastní `Crud` konfiguraci nad `UiElements.BinaryProvider`** se dvěma poli
navíc (`category` ze `appConfig.fileCategoryList`, `date`) — přesně tou cestou, kterou
README `caio-ui` pro tenhle případ předepisuje. Viz [frontend.md](./frontend.md), 6.1.

### 2.12 `appConfig`

| Use case | Metoda | Auth | dtoIn | dtoOut |
|---|---|---|---|---|
| `appConfig/get` | get | – | `{}` | konfigurace (bez interních polí) |
| `appConfig/update` | post | ADMIN | `{ categoryOrder, hideNamesAgeList, notice, contact, socialList, fileCategoryList, founded }` | konfigurace |

`appConfig/get` volá klient jednou při startu SPA (`AppProvider`). **Menu a routy se z něj
neodvozují** – ty staví `season/listCurrent` (sekce 2.2); `appConfig` dodává jen pořadí
kategorií a výjimky. Statický výčet `teams` / `homeAge` z v1 zanikl, protože složení mužstev
se mění každou sezónu.

### 2.13 `identity`

**Celé dodává knihovna** přes `Authentication.createApi()` – aplikace ho jen vloží do `api`.
Původní návrh počítal s vlastním `identity/updateProfileList`; ten **odpadá**.

| Use case | Metoda | Auth | Popis |
|---|---|---|---|
| `identity/search` | get | A | vyhledání identit podle `query` (jen zobrazovací data) |
| `identity/list` | get | A | seznam podle `idList` / `identityList` (jen zobrazovací data) |
| `identity/get` | get | – | identita podle `id` nebo kódu `identity` |
| `identity/adminList` | get | ADMIN | plný seznam vč. `email`, `profileList`, `registrationType`, `sys` – bez hashe hesla a reset tokenu |
| `identity/update` | post | ADMIN | zápis libovolných polí identity (typicky `profileList`); `password` se zahazuje |

**Vyřešeno 2026-09-06.** `adminList` a `update` měly v knihovně natvrdo profil `owner`,
který si nedefinuje žádná appka; opraveno na **`authorities`** — a záměrně **napevno, bez
konfigurace**: práce s identitami a přidělování rolí vypadá stejně ve všech projektech na
tomhle stacku. Nejvyšší role aplikace se jmenuje stejně, takže sedí bez dalšího zařizování.
`update` nevaliduje po polích; obrazovka `admin/identities` posílá jen to, co reálně změnila.

Pozor: `profileList` je zapečený v JWT (`Identity.createToken`), změna se projeví až
po novém přihlášení. UI to musí uživateli sdělit.

### 2.14 Autentizace (knihovna)

Trasy montuje `App.init` sám voláním `Authentication.init(app)`, prefix `/auth`.
Aplikace je nemůže vypnout a nic neregistruje.

| Trasa | Metoda | Popis |
|---|---|---|
| `/auth` | GET | aktuální identita z cookie, jinak `{ identity: null }` |
| `/auth/config` | GET | `{ providerList, password: { minLength, maxBytes, patternSource, patternFlags } }` – které providery deployment má a jaké je pravidlo na heslo |
| `/auth/register` | POST | `{ firstName, surname, email, password }` |
| `/auth/login` | POST | `{ email, password }`, nastaví cookie `token` |
| `/auth/logout` | POST | smaže cookie |
| `/auth/google`, `/auth/google/callback` | GET | Google OAuth |
| `/auth/facebook`, `/auth/facebook/callback` | GET | Facebook OAuth |
| `/auth/password/reset-request` | POST | `{ email }`, pošle odkaz s tokenem |
| `/auth/password/reset` | POST | `{ token, password }`, přepíše heslo |

### 2.14.1 Reset hesla — **hotovo 2026-09-06**

v0 má `/zapomenute-heslo` a nová verze o to nesmí přijít. Patřilo to do knihovny, ne do
aplikace – přihlašovací stránka je `caio-ui/static/login/`, kterou do buildu kopíruje
`caio-devkit`, takže vlastní řešení v appce by znamenalo vlastní `login.html` a rozchod
s celým stackem.

**Implementováno v `caio-server` i `caio-ui`** přesně v tomhle tvaru; pro aplikaci z toho
zbývá jediné: vyplnit `SMTP_HOST`, `MAIL_FROM` a `APP_URL` v `.env`. Bez nich se reset
prostě nenabídne (`/auth/config` hlásí `passwordResetEnabled: false` a login stránka odkaz
schová). Riziko #17 v [README.md](./README.md) padá.

| Vrstva | Co přibude |
|---|---|
| `caio-server-auth` | `POST /auth/password/reset-request { email }` – vygeneruje jednorázový token s expirací (30 min), uloží jeho hash k identitě a pošle e-mail. **Odpovídá vždy `200`**, ať e-mail existuje nebo ne – jinak se z endpointu stane nástroj na zjišťování registrovaných adres. |
| | `POST /auth/password/reset { token, password }` – ověří token a expiraci, přepíše bcrypt hash, token zneplatní, odhlásí ostatní relace. Chyby `caio-server-auth/{invalidToken, tokenExpired}` + stávající pravidla na sílu hesla. |
| | `/auth/config` doplní `passwordResetEnabled` podle toho, jestli je nakonfigurované SMTP – stejná logika jako u OAuth providerů. |
| | nová závislost **nodemailer** + env `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `APP_URL`. |
| `caio-ui` `static/login/` | odkaz **Zapomenuté heslo** pod polem s heslem (jen když `passwordResetEnabled`), panel se zadáním e-mailu a potvrzením; režim `?reset=<token>` se dvěma poli na nové heslo. Pořád vanilla JS, žádný React. |

Dvě věci, které se při implementaci rozhodly a stojí za zapamatování: `/password/reset`
**nenastaví cookie** (přístup do schránky není totéž co sezení u důvěryhodného zařízení,
takže po nastavení hesla následuje normální přihlášení) a reset se nabízí **jen účtům,
které heslo mají** — poslat odkaz Google účtu by mu přidalo heslo, o které nikdo nežádal.

`server/legacy-redirect.js` posílá `/zapomenute-heslo` na `/login.html` a **tam to končí**
(rozhodnuto 2026-09-06). Odkaz na reset hesla nikde jinde než na přihlašovací stránce není
a nebude, takže se nezavádí ani `?mode=forgot`: kdo přijde ze staré URL, vidí přihlášení
s odkazem „Zapomenuté heslo?" a klikne.

- **Jedna identita na e-mail.** Google, Facebook i heslo žijí na jednom dokumentu
  (`googleId`, `facebookId`, `password`); provider se spáruje jen na **ověřený** e-mail,
  jinak `409 identity/emailNotVerified`.
- **Provider bez credentials se nenabízí** – strategie se nezaregistruje, v `/auth/config`
  chybí a jeho routa odpoví, že přihlášení není nastavené (appka nespadne).
- Chybové kódy: `caio-server-auth/{invalidEmail, passwordTooShort, passwordTooLong,
  passwordTooSimple, identityExists, invalidCredentials, invalidJson, bodyTooLarge}`.
- Přihlašovací stránka je **`/login.html`** – statická HTML/CSS/JS stránka, kterou do buildu
  kopíruje `caio-devkit`. `UiAuth.useSession().login()` ji otevře v popupu.
  Vlastní vzhled = položit `client/public/login.html`; devkit pak svoji kopii nevkládá.

---

## 3. Agregace `server/api.js`

Tvar převzatý z `caio_propertyman/server/api.js` – včetně vlastního `sys/health`, který
přebíjí ten vestavěný.

```js
import { readFileSync } from "fs";
import { Authentication, BinaryStore } from "caio-server";

import teamApi from "./team/api.js";
import seasonApi from "./season/api.js";
import matchApi from "./match/api.js";
import statsApi from "./stats/api.js";
import personApi from "./person/api.js";
import playerApi from "./player/api.js";
import coachApi from "./coach/api.js";
import articleApi from "./article/api.js";
import galleryApi from "./gallery/api.js";
import fileApi from "./file/api.js";
import pageApi from "./page/api.js";
import appConfigApi from "./app-config/api.js";
import seoApi from "./seo/api.js";

// Verzi čteme z package.json, ne z process.env.npm_package_version -- ta existuje jen
// při startu přes npm skript, takže `node server/index.js` by hlásil undefined.
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const sysApi = {
  "sys/health": {
    method: "get",
    fn: async () => ({
      version,
      env: process.env.NODE_ENV || "development",
      uptime: Math.round(process.uptime()),
      // Konfigurace se hlásí, ne testuje -- health musí odpovědět i když je Mongo dole.
      mongoConfigured: !!process.env.MONGODB_URI,
      googleAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      gcsConfigured: BinaryStore.isConfigured(),
    }),
  },
};


export default {
  ...sysApi,
  ...teamApi, ...seasonApi, ...matchApi, ...statsApi,
  ...personApi, ...playerApi, ...coachApi,
  ...articleApi, ...galleryApi, ...fileApi, ...pageApi,
  ...appConfigApi, ...seoApi,
  ...Authentication.createApi(),
  ...(BinaryStore.isConfigured()
    ? BinaryStore.createApi({ collectionMap: Config.BINARY_COLLECTION_MAP })   // viz 2.11
    : {}),
};
```

`server/index.js` je jednořádkový – `publicPath` se **nepředává** a `BinaryStore` se
**neinicializuje** (zapne se sám, když je `GCS_BUCKET_NAME`):

```js
import { App } from "caio-server";
import api from "./api.js";
import legacyRedirect from "./legacy-redirect.js";

App.init({ api, middlewareList: [legacyRedirect] });
```

`middlewareList` je **doplněk v `caio-server` ze 6. 9.** Legacy přesměrování musí odpovědět
na cesty jako `/historie`, které by jinak spolkl SPA fallback, a appka si na tohle místo
v pořadí sama nic zaregistrovat nemůže — pořadí drží `init()`.

---

## 4. Veřejné netypové trasy

| Trasa | Popis | Kdo registruje |
|---|---|---|
| `GET /rss` | RSS 2.0 kanál publikovaných článků (náhrada v0 `rss.php`) | aplikace |
| `GET /sitemap.xml` | Mapa stránek pro vyhledávače | aplikace |
| `GET /calendar/team-<id>.ics` | Rozpis zápasů týmu k odběru v telefonu (iCal) | aplikace |
| `GET /login.html` | Přihlašovací stránka (statická, kopíruje ji `caio-devkit`) | devkit |
| `GET /*splat` | SPA fallback: cesta **bez** přípony → `index.html`, s příponou → 404 | `caio-server` |

Netypové trasy se registrují jako use case s `method: "get"`, který si odpověď pošle sám přes
`res` a vrátí `false` – `App.init` pak nic dalšího neodesílá.

Legacy přesměrování (`server/legacy-redirect.js`) musí být namountované **před** SPA
fallbackem – zařizuje to `middlewareList` v `App.init`, viz [migration.md](./migration.md),
sekce 5.

**Stav po dávce ze 6. 9.:** `sitemap.xml` a `calendar/team` běží, `/rss` ne — publikuje
články a ty zatím nejsou. Přidá se s entitou `article`. Přesměrování s číselným `id`
(`/novinka-<n>`, `/informace-o-zapase-<n>`, `/fotogalerie-<n>`) čekají na mapovací kolekci
`migration_map`, tedy na migraci; statická přesměrování fungují.
