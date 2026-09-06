# Role a oprávnění

Datum: 2026-09-06

**Tenhle dokument je zdroj pravdy pro autorizaci.** [api.md](./api.md) u každého use casu
odkazuje na množiny definované tady; když si odporují, vyhrává tenhle dokument.

---

## 1. Jak autorizace funguje v `caio-server`

- Role jsou **pole stringů v `identity.profileList`**. `Identity.createToken` ho kopíruje
  beze změny do JWT (`caio-server-auth/abl/identity.js`), takže je to volný seznam —
  knihovna obsah nijak nevaliduje.
- Use case deklaruje `auth`:
  - `true` — stačí být přihlášený,
  - `["a", "b"]` — musí sedět **alespoň jedna** role,
  - `async ({ dtoIn, identity, req }) => boolean` — vlastní logika; **jediný způsob, jak
    rozhodnout podle obsahu `dtoIn`**.
- **Dědičnost neexistuje.** `auth: ["operatives"]` znamená doslova ten jeden profil.
  Nadřazené role se proto musí vypisovat do každého seznamu — což řeší množiny v sekci 4.
- **Změna role se projeví až po novém přihlášení**, protože `profileList` je zapečený
  v JWT. UI to musí uživateli říct.

> **Dvě změny v `caio-server`, které z tohohle modelu plynou:**
> **(1)** identity smí editovat jen `authorities` — **hotovo**, viz sekce 6;
> **(2)** binárky se dělí do kolekcí s vlastní autorizací — **k implementaci**, viz sekce 5.1.

---

## 2. Seznam rolí

| # | Role | Kdo to je v klubu | Co smí navíc oproti nižším |
|---|---|---|---|
| 0 | **Guest** (bez přihlášení) | návštěvník webu | všechna veřejná `GET` |
| 1 | **`members`** | hráč, člen klubu | interní údaje u zápasu (odjezd, nominace), vlastní profil |
| 2 | **`teamEditor:<teamId>`** | trenér nebo vedoucí jednoho mužstva | soupiska, realizační tým a zápasy **svého** týmu |
| 3 | **`matchEditor`** | zapisovatel výsledků | zápasy, výsledky a sestavy **všech** týmů, import rozlosování |
| 4 | **`newsEditor`** | ten, kdo píše novinky | články včetně jejich obsahu a titulních fotek |
| 5 | **`galleryEditor`** | klubový fotograf | fotogalerie a alba |
| 6 | **`contentEditor`** | kronikář / tajemník | obsahové stránky (historie, hymna, kontakt, výbor, týmové fotky) a soubory ke stažení |
| 7 | **`operatives`** | správce obsahu | všechno z 2–6 dohromady, plus osoby, týmy a sezóny |
| 8 | **`authorities`** | správce webu | navíc identity, přidělování rolí a konfigurace aplikace |

Navíc jedna **dimenze, která není role**:

| | Význam |
|---|---|
| **self** | Volající je vlastníkem záznamu — `person.identity === identity.identity`. Odemyká vlastní kontaktní údaje a vlastní profil. Vyhodnocuje se v `crud.js` podle obsahu dat, ne přes `auth`. |

### Co jsem doplnil proti tvému seznamu a proč

- **`galleryEditor`** — fotky bývají práce jednoho člověka, který s články ani zápasy nemá
  nic společného. Bez téhle role by fotograf potřeboval `operatives`, tedy i právo přepsat
  výsledky.
- **`contentEditor`** — `newsEditor` píše novinky, ale **nemá důvod přepisovat historii
  klubu nebo kontakty**. Jsou to dva různí lidé a dva různé druhy obsahu (článek má
  životní cyklus, obsahová stránka je trvalá).
- **`members`** — v návrhu už byla; drží se, protože odjezd na zápas a nominace nemají být
  veřejné.

Co jsem **nepřidal**, i když by to šlo: samostatnou roli pro soubory ke stažení (splývá
s `contentEditor`), pro tabulky (počítají se, needitují se) a pro statistiky (dopočet
ze sestav). Kdyby se ukázaly potřeba, jde je doplnit bez zásahu do modelu.

---

## 3. `teamEditor` — role s rozsahem

Zbylé role jsou plošné, tahle je vázaná na **konkrétní tým**. `profileList` je plochý
seznam stringů, takže rozsah se zapíše **do jména profilu**:

```json
{ "profileList": ["members", "teamEditor:6512ab34cd56ef7890123456"] }
```

Jeden člověk může mít i víc týmů (`teamEditor:A`, `teamEditor:B`). Vyhodnocuje se funkcí
`auth`, protože rozhodnutí závisí na `dtoIn`:

```js
// server/services/authorize.js
const PREFIX = "teamEditor:";

function myTeamIdList(identity) {
  return (identity?.profileList ?? [])
    .filter((p) => p.startsWith(PREFIX))
    .map((p) => p.slice(PREFIX.length));
}

/**
 * @param resolveTeamIdList  async (dtoIn) => string[]  -- kterých týmů se dtoIn týká
 * @param baseRoleList       role, které projdou bez ohledu na tým
 * @param mode               "any" = stačí jeden můj tým, "all" = musí být všechny moje
 */
function teamScoped(resolveTeamIdList, baseRoleList, mode = "all") {
  return async ({ dtoIn, identity }) => {
    const profileList = identity?.profileList ?? [];
    if (profileList.some((p) => baseRoleList.includes(p))) return true;

    const mine = myTeamIdList(identity);
    if (!mine.length) return false;

    const target = await resolveTeamIdList(dtoIn);
    if (!target.length) return false;
    return mode === "any"
      ? target.some((id) => mine.includes(id))
      : target.every((id) => mine.includes(id));
  };
}
```

### Jak se rozsah zjišťuje u jednotlivých use casů

| Use case | `resolveTeamIdList` | `mode` |
|---|---|---|
| `match/create` | `[dtoIn.homeTeamId, dtoIn.guestTeamId]` | **`any`** — můj tým musí být jeden ze dvou |
| `match/update`, `setResult`, `delete` | načíst zápas podle `dtoIn.id` → jeho dva týmy | `any` |
| `match/setLineup` | totéž | `any` **+ dodatečná kontrola**, viz níž |
| `team/update` | `[dtoIn.id]` | `all` |
| `player/create`, `update`, `addTeam`, `endTeam` | týmy z `dtoIn.teamId` / `dtoIn.teamList` | `all` |
| `coach/create`, `update`, `delete` | týmy z `dtoIn.teamList` | `all` |

Tři věci, které je snadné přehlédnout a bolí později:

1. **`setLineup` musí být zúžený na vlastní tým.** Zápas má dva týmy a `any` pustí editora
   kteréhokoli z nich — ale nesmí zapsat sestavu **soupeři**. `crud.js` proto u `setLineup`
   navíc ověří, že všichni hráči v `playerList` patří do týmu, který volající spravuje,
   a ostatní záznamy nechá být. Výsledek (`setResult`) naopak může zapsat kterýkoli
   z obou — byli u toho oba.
2. **`teamEditor` nesmí přepsat soupeře.** Editor týmu A by si jinak mohl změnit
   `guestTeamId` a dostat se k cizímu zápasu. Omezení je **jen na `teamEditor`** —
   `matchEditor`, `operatives` i `authorities` smějí u `match/update` měnit
   `homeTeamId`/`guestTeamId` bez omezení. Je to tedy kontrola na úrovni pole, ne
   use casu: `crud.js` zahodí změnu obou polí, pokud volající prošel jen rozsahovou rolí.
3. **`person` zůstává mimo rozsah.** Osoba může hrát za víc týmů, takže `teamEditor` smí
   osobu **založit** (aby mohl doplnit soupisku), ale editovat a mazat ji smí až
   `operatives`. Členství v týmu se řeší přes `player/addTeam` / `endTeam`, které rozsah
   respektují.

### Proč rozsah v profilu, a ne ve zvláštní kolekci

| | Profil s parametrem (**zvoleno**) | Kolekce `grant` |
|---|---|---|
| Změna knihovny | žádná | žádná |
| Dotaz do DB při každém volání | ne (je v JWT) | ano (cachovatelné) |
| Projeví se změna hned | ne, až po novém přihlášení | ano |
| Smazání týmu | zůstane osiřelý profil | dá se uklidit cizím klíčem |

Pro klub se třemi až čtyřmi mužstvy a hrstkou správců, kde se role mění jednou za sezónu,
je parametrizovaný profil dost dobrý — a „projeví se až po novém přihlášení“ platí
u `profileList` tak jako tak, takže to nepřidává nový druh problému. Kdyby rozsahů
přibylo (podle sezóny, podle soutěže), je přechod na kolekci `grant` přímočarý:
změní se jen `myTeamIdList()`.

Administrace v `admin/identities` musí `teamEditor:<id>` **zobrazovat jako název týmu**,
ne jako holé id, a nabízet výběr týmu — jinak to nikdo nenastaví správně.

---

## 4. Množiny rolí v kódu

Knihovna nedědí, takže se seznamy vypisují celé. Definice na jednom místě —
`server/config.js`:

```js
export const ROLE = {
  MEMBERS: "members",
  TEAM_EDITOR: "teamEditor",        // parametrizovaný: teamEditor:<teamId>
  MATCH_EDITOR: "matchEditor",
  NEWS_EDITOR: "newsEditor",
  GALLERY_EDITOR: "galleryEditor",
  CONTENT_EDITOR: "contentEditor",
  OPERATIVES: "operatives",
  AUTHORITIES: "authorities",
};

export const ADMIN   = [ROLE.AUTHORITIES];
export const CONTENT = [ROLE.OPERATIVES, ...ADMIN];
export const MATCH   = [ROLE.MATCH_EDITOR, ...CONTENT];
export const NEWS    = [ROLE.NEWS_EDITOR, ...CONTENT];
export const GALLERY = [ROLE.GALLERY_EDITOR, ...CONTENT];
export const PAGES   = [ROLE.CONTENT_EDITOR, ...CONTENT];
export const MEMBER  = [ROLE.MEMBERS, ...CONTENT];
```

V tabulce níž se používají tyhle názvy množin, ne jednotlivé role.

---

## 5. Tabulka use casů

Legenda: **–** veřejné · **A** jakýkoli přihlášený · **self** vlastník záznamu ·
**TE** `teamEditor:<teamId>` (rozsah dle sekce 3) · množiny z sekce 4.

### Týmy, sezóny, tabulka

| Use case | Kdo | Poznámka |
|---|---|---|
| `team/list`, `team/get` | – | |
| `team/create` | CONTENT | |
| `team/update` | CONTENT, **TE** | TE jen svůj tým (logo, název, zkratka) |
| `team/delete` | CONTENT | |
| `season/list`, `get`, `getCurrent`, `listCurrent`, `listYears` | – | `listCurrent` staví menu |
| `season/create`, `update`, `delete` | CONTENT | zakládá kategorie pro ročník |
| `stats/getTable`, `listPlayerStats`, `getPlayerStats` | – | počítané, nejde editovat |

### Zápasy

| Use case | Kdo | Poznámka |
|---|---|---|
| `match/list`, `get`, `getLast`, `getNext` | – | `departureTime` jen MEMBER, viz sekce 7 |
| `match/create` | MATCH, **TE** (`any`) | TE: jeho tým musí být jeden z dvojice |
| `match/createMany` | MATCH | hromadný import rozlosování |
| `match/update` | MATCH, **TE** (`any`) | TE nesmí měnit `homeTeamId`/`guestTeamId` |
| `match/setResult` | MATCH, **TE** (`any`) | kterýkoli z obou týmů |
| `match/setLineup` | MATCH, **TE** (`any`) | TE zapisuje **jen hráče svého týmu** |
| `match/delete`, `deleteMany` | MATCH | TE ne — mazání zápasu je zásah do soutěže |

### Osoby, hráči, trenéři

| Use case | Kdo | Poznámka |
|---|---|---|
| `person/list`, `get` | – | kontakty jen CONTENT nebo self, viz sekce 7 |
| `person/create` | CONTENT, **TE** | TE zakládá osobu kvůli soupisce |
| `person/update`, `delete` | CONTENT | osoba je sdílená napříč týmy |
| `person/linkIdentity` | ADMIN | ruční spojení osoby s přihlášením |
| `person/linkSelf` | přihlášený | spáruje volajícího s jeho `person` podle **ověřeného** e-mailu; jinak nedělá nic (viz [api.md](./api.md), 2.5.1) |
| `player/list`, `get` | – | |
| `player/create`, `update` | CONTENT, **TE** (`all`) | |
| `player/addTeam`, `endTeam` | CONTENT, **TE** (`all`) | jen do/z vlastního týmu |
| `player/delete` | CONTENT | |
| `coach/list`, `get` | – | |
| `coach/create`, `update`, `delete` | CONTENT, **TE** (`all`) | realizační tým vlastního mužstva |

### Články a obsah

| Use case | Kdo | Poznámka |
|---|---|---|
| `article/list`, `get` | – | nepřihlášený vidí jen `published` |
| `article/create`, `update`, `setState`, `delete` | NEWS | |
| `page/get` | – | bere `code`, ne jen `id` |
| `page/list` | PAGES | správcovský výpis |
| `page/create`, `update`, `delete` | PAGES | obsahové stránky |

> **Obsah článku a obsah stránky jsou dvě různé entity se dvěma různými rolemi**
> (rozhodnuto 2026-09-06). Dřívější návrh držel obojí v ECC sekcích, a proto potřeboval
> `authorize` funkci, která dohledala, čí je stránka — jinak by `newsEditor` mohl přepsat
> historii klubu i hymnu. Když je obsah pole entity, řeší se to samo: `article.content`
> spadá pod NEWS, `page.sectionList` pod PAGES.

### Média a soubory

| Use case | Kdo | Poznámka |
|---|---|---|
| `gallery/list`, `get`, `listPhotos` | – | |
| `gallery/create`, `update`, `delete` | GALLERY | |
| `gallery/addPhoto`, `deletePhoto` | GALLERY | |
| `file/list` | – | veřejné „ke stažení“ |
| `binary/list`, `binary/get` | podle kolekce | viz 5.1 |
| `binary/create`, `update`, `delete`, `deleteMany` | podle kolekce | viz 5.1 |

### 5.1 Binárky se dělí do kolekcí

Jedna společná role na všechny binárky nestačí: fotograf, který nahrává do galerie, nemá
mít možnost přepsat logo klubu. **Každá binárka proto patří do pojmenované kolekce
a autorizace se nastavuje per kolekce.**

| Kolekce | Co v ní je | Zápis |
|---|---|---|
| `sys` | logo klubu, favicon, PWA ikony | CONTENT |
| `team` | loga týmů | CONTENT, **TE** |
| `person` | portréty osob | CONTENT, **TE** |
| `article` | titulní fotky článků | NEWS |
| `gallery` | fotky alb (plné i náhledy) | GALLERY |
| `page` | obrázky v obsahových stránkách (týmové fotky) | PAGES |
| `file` | PDF ke stažení (rozpisy) | PAGES |

Čtení (`list`, `get`) je u všech kolekcí tohoto webu veřejné — všechno, co se nahrává, se
stejně veřejně zobrazuje. Konfigurace to ale musí umět rozlišit taky.

Tím **zaniká množina `UPLOAD`** — nikdo nepotřebuje oprávnění „smí nahrát cokoli“.

**Jak se kolekce zjistí:**

- u `create` z `dtoIn.collection` (povinné; neznámá kolekce → 400),
- u `get`/`update`/`delete`/`deleteMany` **ze samotného záznamu**, ne z `dtoIn` — jinak by
  si volající kolekci nalhal. Autorizační funkce si tedy záznam načte dřív, než rozhodne;
  `auth` dostává jen `dtoIn`, takže ten dotaz dělá sama.

Kromě rolí jde kolekci omezit i na **konkrétní identity** (`identityList`) — třeba `sys`
jen na dva lidi bez ohledu na to, kdo má `operatives`.

> **Kolekce chrání API, ne bytes.** Objekty v GCS jsou veřejné na své `uri`, takže kdo URL
> zná, stáhne soubor bez ohledu na kolekci. Pro veřejný klubový web to nevadí. Kdyby někdy
> vznikla kolekce, která má být skutečně neveřejná, musely by být objekty v bucketu
> privátní a servírovat se přes podepsané URL — to dnes `BinaryStore` neumí.

**Je to změna v `caio-server`**, ne v aplikaci; návrh API je v [api.md](./api.md),
sekce 2.11.

### Provoz a identity

| Use case | Kdo | Poznámka |
|---|---|---|
| `sys/health` | – | |
| `GET /rss`, `/sitemap.xml`, `/calendar/team-<id>.ics` | – | |
| `appConfig/get` | – | |
| `appConfig/update` | ADMIN | pořadí kategorií, upozornění, kontakty |
| `identity/get` | – | jen zobrazovací data |
| `identity/search`, `identity/list` | A | výběr uživatele ve formuláři |
| `identity/adminList`, `identity/update` | ADMIN | **viz sekce 6** |
| `/auth/*` | – | login, logout, OAuth, reset hesla |

---

## 6. Identity: `authorities`, napevno

**Vyřešeno 2026-09-06 v `caio-server`.** `identity/adminList` a `identity/update` měly
`auth: ["owner"]` — profil, který si žádná appka nedefinuje. Změněno na **`authorities`**,
a to **napevno, bez konfigurace**: práce s identitami a přidělování rolí je jediné
oprávnění, které vypadá stejně ve všech projektech na tomhle stacku.

```js
// caio-server/src/caio-server-auth/api/identity-api.js
const ADMIN_PROFILE = "authorities";
```

**Identity smí editovat jen `authorities`.** Role `owner` neexistuje.

Změna je zatím jen v pracovním stromu `caio-architecture` — než se projeví v aplikaci,
musí se `caio-server` přebalit a přeinstalovat (viz [README.md](./README.md), riziko #16).

---

## 7. Autorizace, která není v `auth`

Dvě pravidla závisí na obsahu odpovědi, ne na volání, takže je vynucuje `crud.js`, ne `auth`:

| Pravidlo | Kde |
|---|---|
| **Kontakty osob** (`birthdate`, `email`, `phone`) se vrací jen CONTENT nebo **self** | `person/crud.js` filtruje `dtoOut` |
| **`match.departureTime`** se vrací jen MEMBER a výš | `match/crud.js` filtruje `dtoOut` |

Musí to být ve vrstvě `crud.js`, ne v jednotlivých use casech — jinak stačí najít druhý
endpoint, který tutéž entitu vrací, a filtr se obejde (`player/list` vkládá `person`,
`match/get` vkládá sestavu).

---

## 8. Klient

Na klientu se stejná pravidla duplikují — jde o UX, **ne o bezpečnostní hranici**:

- ochrana rout: `UiApp.withRoute(Component, { profileList: [...] })`,
- podmíněné `actionList` u tabulek a detailů,
- `teamEditor` potřebuje na klientu tutéž funkci `myTeamIdList()`, aby se v menu
  `admin/*` ukázaly jen jeho týmy.

Pravidlo pro každou obrazovku: **co uživatel nesmí, se nemá ukazovat zašedlé — nemá se
ukazovat vůbec.** Výjimka je akce, po které má následovat výzva k přihlášení.
