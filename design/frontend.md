# Frontend

Vite 6 + React 18.3.1 + `uu5g05`, stavební kameny z `caio-ui`.
Struktura a konvence se drží referenční appky [`caio_propertyman`](../../caio_propertyman).

**Základní pravidlo: všechno se staví z `uu5g05` / `uu5g05-elements` / `uu5g05-forms` /
`uu5tilesg02` a `caio-ui`.** Vzhled se ladí **propsy**. `className` (přes `Config.Css.css`)
je poslední možnost pro případy, kdy komponenta prop nemá – a každý takový případ se zapisuje
do `docs/decisions.md` i s důvodem. Předloha z Lovable je vizuální reference,
**ne zdroj kódu** – viz [ux-design-system.md](./ux-design-system.md).

Všechny soubory s JSX mají příponu **`.jsx`**.

---

## 1. Bootstrap

```
client/
  index.html
  vite.config.js        export default createViteConfig()   // z caio-devkit/vite
  public/
    favicon.ico
    assets/meta/        manifest.json, icon-192/512, icon-maskable, apple-touch-icon, og-image
    assets/fonts/       bebas-neue-400-{latin,latin-ext}.woff2, barlow-{400,600,700}-{latin,latin-ext}.woff2
  src/
    main.jsx            createRoot(...).render(<App />)
    app.jsx             UiApp.SpaProvider > UiApp.Spa(top, footer, main) > Router
    router.jsx          useRouter(routeMap) + Suspense + ErrorBoundary
    fonts.css           @font-face pro Bebas Neue a Barlow
    config/config.js    TAG, Css, AGE_MAP, POSITION_MAP
    config/theme.js     designové tokeny (jediné místo s hexy a velikostmi písma)
    lsi/                import-lsi.js, cs.json          (en.json se nezakládá)
    core/app-context.jsx  appConfig/get + season/listCurrent + team/list -> konfigurace, menu, mapa týmů
```

### 1.1 `app.jsx`

`UiApp.SpaProvider` skládá `AppBackgroundProvider → LanguageListProvider → LanguageProvider →
UiAuth.SessionProvider → RouteProvider`. `UiApp.Spa` přidá `ErrorBoundary → ModalBus → AlertBus`
a – dostane-li `top`/`footer` – i celý rám stránky (`UiApp.Page`: lišta + `<main>` + patička).
**Aplikace tedy nemá vlastní komponentu na hlavičku ani `Page`.**

```jsx
<Uu5Elements.SpacingProvider type="loose">
  <UiApp.SpaProvider languageList={["cs"]}>
    <UiApp.Spa top={TOP} footer={<Footer />} main={{ padding: false, sticky: "always" }}>
      <Router />
    </UiApp.Spa>
  </UiApp.SpaProvider>
</Uu5Elements.SpacingProvider>
```

- `SpacingProvider type="loose"` – jde o web, ne o aplikaci; zvedá vnitřní mezery uu5 komponent
  bez jediného řádku CSS.
- `main={{ padding: false }}` – sekce si gutter i vertikální rytmus řeší samy
  (`components/layout/section.jsx`).
- **`sticky` patří do `main`, ne do `top`.** `Spa` rozbaluje objekt `main` do props `Page`
  a `sticky` je prop `Page`, ne lišty (`Top` má jen `logo`, `menu`, `transparent`,
  `cssBackground`, `cssColor`, `colorScheme`, `maxWidth`). Výchozí `sticky: true` je
  `"onScrollUp"`, což by lištu při scrollování dolů schovávalo — předloha ji chce vidět pořád.
- Klubová barva: `Uu5Elements.UuGds.setMeaningColor("primary", "#D01319")` (hodnota z předlohy;
  v1 měla `#8b0000`).

### 1.2 Horní lišta

`Top` z `caio-ui` **není exportovaný schválně** – lišta se konfiguruje výhradně propem `top`:

| Prop | Použití v AFK |
|---|---|
| `logo` | `{ uri: Config.asset.logo, href: "home", tooltip: undefined }` – klubový erb |
| `children` | `Uu5Elements.Header` s `title` „AFK Bratčice“ a `subtitle` „od roku 1932“ |
| `menu.itemList` | Aktuality, Historie, Mužstva (s podpoložkami), Fotogalerie, Ke stažení, Kontakt + položka identity |
| `cssBackground` / `cssColor` | `theme.color.bg` / `theme.color.fg` – GDS paleta `building` je bílá a nepřenastaví se. Obojí bere i funkci `({ stuck }) => hodnota`, takže lišta může nad hero fotkou začít průhledná a po dosednutí ztmavnout |

Sbalení menu do hamburgeru na mobilu řeší `Uu5Elements.ActionGroup` uvnitř `Top` sám – nic se
nenastavuje. Aktivní položka se zvýrazní `significance: "highlighted"`.

**Tlačítko identity si přidává aplikace** (`Top` ho sám nepřidává, viz [README.md](./README.md),
riziko #13): nepřihlášenému položka *Přihlásit se* volající `UiAuth.useSession().login()`,
přihlášenému `UiAuth.IdentityItem` s dropdownem *Profil* / *Odhlásit se*.

### 1.3 Router

`useRouter(routeMap)` + `Suspense` + `ErrorBoundary` s `resetKey` odvozeným z routy a stavu
session. Obrazovky se načítají lazy přes `Utils.Component.lazy(() => import(...))`.

> Vzor je v1 `client/.../core/router.js`. Ten soubor už **v pracovní kopii není** — v2 celý
> starý strom nahradil; sáhnout se pro něj dá do historie (`git show master:…`). Živá
> reference je `caio_propertyman`.

**Menu a routy se odvozují ze `season/listCurrent`**, ne z konfigurace: pro každou kategorii,
kterou klub v aktuálním ročníku má, se do menu vloží položka s podpoložkami Soupiska /
Zápasy / Tabulka (poslední jen když `hasTable`) a do `routeMap` se doplní `teamId`
a `seasonId` jako výchozí parametry. Pořadí dává `appConfig.categoryOrder`.
Podrobně sekce 2.5.

---

## 2. Routy

### 2.1 Veřejné

**Adresy jsou české** (rozhodnuto 2026-09-06) — je to web českého klubu a hlavně jsou tím
shodné s v0, takže osm starých URL sedí **bez jediného přesměrování**.

| Routa | Obrazovka | Parametry |
|---|---|---|
| `` (kořen) | Úvodní stránka | – |
| `novinky` | Seznam novinek | `pageIndex` |
| `novinka` | Detail článku | `id` |
| `muzstva` | Přehled mužstev | – |
| `muzstvo` | Soupiska týmu | `id`, `seasonId` |
| `muzstvo/zapasy` | Zápasy týmu | `id`, `seasonId`, `round` (doskrolování na kolo) |
| `muzstvo/tabulka` | Tabulka soutěže | `id`, `seasonId` |
| `muzstvo/statistiky` | Statistiky hráčů | `id`, `seasonId` |
| `kolo` | Kolo v soutěži – všechny zápasy | `seasonId`, `round` |
| `zapas` | Detail zápasu | `id` |
| `hrac` | Profil hráče | `id` |
| `fotogalerie` | Seznam alb | `pageIndex` |
| `fotogalerie/album` | Album (lightbox) | `id` |
| `ke-stazeni` | Ke stažení | `category` |
| `historie`, `hymna`, `vybor`, `treninky`, `tymove-fotky` | Obsahové stránky | – |
| `kontakt` | Kontakt (data z `appConfig`) | – |
| `profil` | Profil přihlášeného uživatele | – |
| `*` | 404 s odkazy na hlavní sekce | – |

**Obsahové stránky jsou natvrdo v kódu** (`client/src/content/pages.js`) jako `uu5String`
a entita `page` **se zatím nedělá** — počká na ECC (viz [README.md](./README.md), sekce 2).
Jedna obrazovka `routes/page.jsx` je vykresluje všechny; kterou, říká routa, ne parametr.
Obsah renderuje **`Uu5.Content`**.

Kód stránky **je zároveň její adresa**, takže je součástí veřejného kontraktu:
přejmenovat `historie` znamená rozbít odkaz, který na webu žije od roku 2011. Jediná
výjimka je `/tymove_fotky` z v0 — podtržítko se přesměrovává na `tymove-fotky`.

**Poznámka k předloze:** prototyp má jen `/`, `/historie`, `/muzstva`, `/fotogalerie`
a `/kontakt`. Routa `teams` odpovídá jeho `/muzstva`, `page?code=history` jeho `/historie`
a `page?code=contact` jeho `/kontakt`; zbytek předloha nemá.

### 2.2 Správcovské

| Routa | Obsah |
|---|---|
| `admin/teams` | CRUD týmů (vč. loga) |
| `admin/seasons` | CRUD sezón, přiřazení týmů |
| `admin/matches` | CRUD zápasů, hromadné vytvoření, zápis výsledku a sestavy |
| `admin/persons` | CRUD osob |
| `admin/players` | CRUD hráčů, členství v týmech |
| `admin/coaches` | CRUD trenérů a výboru |
| `admin/articles` | CRUD článků; obsah `uu5String` v `uu5codekitg01-forms` |
| `admin/galleries` | CRUD alb, hromadný upload fotek |
| `admin/files` | Soubory ke stažení – vlastní `Crud` nad `BinaryProvider` (viz 6.1) |
| `admin/pages` | CRUD obsahových stránek; obsah `uu5String` v `uu5codekitg01-forms` |
| `admin/identities` | Správa identit a `profileList` (jen ADMIN) |
| `admin/config` | Konfigurace aplikace (jen ADMIN) |

Kdo na kterou obrazovku smí, určuje [roles.md](./roles.md); většina z nich je pro množinu
`CONTENT`, specializované role vidí jen svou část (`newsEditor` → `admin/articles`,
`galleryEditor` → `admin/galleries`, `teamEditor` → jen svoje týmy).

Ochranu řeší `UiApp.withRoute(Component, { profileList: [...] })` – nepřihlášený dostane
`UiAuth.Unauthenticated`, přihlášený bez role `UiAuth.Unauthorized`. Je to **UX, ne
bezpečnostní hranice**; rozhoduje server. Co uživatel nesmí, se nemá ukazovat zašedlé —
nemá se ukazovat vůbec.

**Rozsahová role `teamEditor:<teamId>` se píše jako `"teamEditor:*"`.** `withRoute` původně
porovnával profily na přesnou shodu, takže „kdokoli, kdo spravuje nějaký tým" se jím vyjádřit
nedal; **doplněno do `caio-ui` 2026-09-06** — položka končící `:*` matchuje jakýkoli profil
s tím prefixem a neprázdným rozsahem. Rozsahové role nejsou nic specifického pro fotbalový
klub, „správce jednoho záznamu" potká každý projekt, takže to patří do knihovny, ne do appky.

```jsx
const AdminMatches = UiApp.withRoute(Matches, { profileList: ["authorities", "operatives", "matchEditor", "teamEditor:*"] });
```

*Které* týmy to jsou, si obrazovka zjistí až uvnitř přes `UiAuth.getScopeList(identity,
"teamEditor")` — vrací pole `teamId`, stejně jako `myTeamIdList()` na serveru. Obrazovky,
které to používají: `admin/matches`, `admin/players`, `admin/coaches`, `admin/teams`.

### 2.3 Pokrytí rout současného webu

Kontrola proti živému `afkbratcice.cz` (5. 9. 2026) — odtud se bere obsah.

**Adresy nové appky jsou české** (rozhodnuto 2026-09-06) — je to web českého klubu a hlavně
tím většina rout sedí s v0 **bez jediného přesměrování**, takže co je naindexované ve
vyhledávači, zůstává platné.

| URL v0 | Obsah | Nová routa | Stav |
|---|---|---|---|
| `/`, `/home`, `/home-<n>` | novinky se stránkováním | `/` (home), `novinky?pageIndex` | ✅ |
| `/novinka-<n>` | detail novinky | `novinka?id` | ✅ (adresa s `id`; číselné přesměrování čeká na `migration_map`) |
| `/historie` | historie klubu (text) | `historie` | ✅ |
| `/hymna` | text hymny „Traverza“ | `hymna` | ✅ |
| `/kontakt` | kontakty + GPS + mapa | `kontakt` | ✅ (data z `appConfig.contact`, ne obsahová stránka) |
| `/vybor` | Výbor AFK (7 lidí, telefony, e-maily) | `vybor` (časem `coach/list?role=board`) | ✅ |
| `/muzi`, `/zaci`, `/stara-garda` | soupiska + týmová fotka | `muzstvo?id` | ✅ |
| `/zapasy`, `/zapasy-15`, `/zapasy-25` | zápasy kategorie | `muzstvo/zapasy?id` | ✅ |
| `/vsechny-zapasy-<kat>#<n>kolo` | všechny zápasy, kotva na kolo | `muzstvo/zapasy?id&round` | ✅ (doplněn parametr `round`) |
| `/tabulka-muzi`, `/tabulka-zaci`, `/tabulka-dorost` | tabulka soutěže | `muzstvo/tabulka?id` | ✅ |
| `/informace-o-zapase-<n>` | detail zápasu + **ostatní výsledky kola** | `zapas?id` | ✅ (doplněno, viz 3.7) |
| `/fotogalerie`, `/fotogalerie-<n>` | 19 alb, detail alba | `fotogalerie`, `fotogalerie/album?id` | ✅ |
| `/tymove_fotky` | historické týmové fotky po ročnících se jmennými popisky | `tymove-fotky` | ✅ obsahová stránka v kódu, viz 3.11.2 |
| `/ke-stazeni` | rozpisy zápasů po sezónách (~40 PDF) | `ke-stazeni?category` | ⏳ obrazovka zatím není |
| `/treninky` | informace o trénincích | `treninky` | ✅ |
| `/diskuze` | diskuzní fórum | – | ❌ **vyřazeno z rozsahu** |
| `/prihlaseni` | přihlášení (formulář v hlavičce) | `/login.html` (devkit) | ✅ |
| `/zapomenute-heslo` | reset hesla | `/login.html` → odkaz na stránce → mail → `?reset=<token>` | ✅ **hotovo 6. 9.** v `caio-server` i `caio-ui`, viz [api.md](./api.md), 2.14.1 |
| `/rss` | RSS kanál | `GET /rss` | ✅ RSS 2.0, posledních 20 publikovaných, čistě chronologicky |
| `/editace-*`, `/upravit-*`, `/novy-*`, `/smazat-*` | správa obsahu | `admin/*` | ✅ |
| `/pokladna`, `/pokuty`, `/prijem`, `/vydaj` | klubová kasa | – | ❌ mimo rozsah (410 Gone) |
| `/api/<uc>` | staré JSON API | – | ❌ 410 Gone (nový kontrakt) |

Tři věci, které z kontroly vyplynuly a v návrhu chyběly:

1. **Boční panel na každé stránce** (Upozornění, poslední/následující zápas s odpočtem,
   mini tabulka) — doplněno jako sekce 3.12.
2. **Ostatní výsledky kola** na detailu zápasu — doplněno do sekce 3.7.
3. **Kategorie jsou čtyři, ne tři.** Menu v0 má Muži / Mládež / Stará garda, ale boční panel
   a tabulky pracují s **Muži, Dorost, Žáci** a stará garda tabulku nemá. Řeší to dynamické
   odvození kategorií ze sezón (sekce 2.5) — složení mužstev se stejně mění rok od roku.

**Týmové fotky** jsou ECC stránka `page?code=team-photos` — chronologie od roku 1943, kde
u každé fotky stojí jmenný seznam („Horní řada zleva: …“). Album v galerii takhle dlouhý
popisek neunese. Odkazuje se z historie, patří k ní. Viz sekce 3.11.

### 2.4 Pohledy na zápasy

Zápasy jsou nejsledovanější obsah webu, takže na ně vede víc cest. Rozdělené podle toho,
jestli se ptáme „co hraje **můj tým**“, nebo „co se děje **v soutěži**“, nebo „co je
**tenhle víkend**“.

### Základní tři

| Pohled | Kde | Kdy ho člověk chce |
|---|---|---|
| **Zápasy týmu v sezóně** | routa `team/matches?id&seasonId` | „Jak jsme na tom celou sezónu“ — rozpis i výsledky na jedné ose, řazeno podle kola |
| **Kolo v soutěži** | routa `round?seasonId&round` | „Jak dopadli ostatní“ — všechny zápasy kola napříč celou soutěží, ne jen naše |
| **Program víkendu** | **sekce na home**, ne vlastní routa | „Kdo kdy hraje“ — všechny kategorie klubu na nejbližší víkend pohromadě |

Třetí pohled na současném webu není a je z nich **nejužitečnější**: klub má tři až čtyři
mužstva, která hrají v sobotu a v neděli na různých místech a v různé časy. Dnes to člověk
poskládá jen ze tří widgetů v postranním panelu.

Je to ale **komponenta na úvodní stránce, ne samostatná routa** — na home se stejně chodí
nejdřív a vlastní URL by pro jeden seznam byla režie navíc.

**Všechny tři jedou přes jeden `match/list`**, jen s jinými filtry — server nemá zvláštní
use case na „víkend“ ani na „kolo“. Parametry a jejich sémantika jsou v
[api.md](./api.md), sekce 2.3.

### Dělení a filtry uvnitř pohledu na tým

- **Rozpis vs. výsledky** — `Uu5Elements.Tabs` nad stejným seznamem. Odehrané sestupně
  (poslední nahoře), nadcházející vzestupně (nejbližší nahoře). Výchozí záložka podle toho,
  jestli sezóna běží.
- **Doma / venku / vše** — `Uu5Forms.SwitchSelect`.
- **Přepínač sezóny** — archiv; sezóny z `season/list?teamId`.

### Odvozené pohledy, které stojí skoro nic

| Pohled | Kde | Z čeho |
|---|---|---|
| **Vzájemné zápasy (H2H)** | na detailu zápasu, pod hlavičkou | `match/list?teamId&opponentId` — „poslední 3 vzájemné“ |
| **Zápasy hráče** | na profilu hráče | `match.playerList.playerId` — už se agreguje pro statistiky |
| **Poslední forma** | sloupec v tabulce soutěže | posledních 5 výsledků jako V-R-P kolečka; standard na moderních fotbalových webech |
| **Odběr kalendáře** | tlačítko u zápasů týmu | `GET /calendar/team-<id>.ics` — člověk si rozpis přidá do telefonu a víc web nepotřebuje |

`ics` export je z celého seznamu ten nejlevnější přírůstek s největším dopadem —
`caio_propertyman` má hotovou `services/ical-export.js`, ze které se dá vyjít.

### Co záměrně nebude

- **Měsíční kalendář.** Jeden až dva zápasy týdně → prázdná mřížka. Seznam je lepší.
- **Živé přenosy / minutu po minutě.** Nemá to kdo plnit.
- **Tabulka formy, xG, heat mapy.** Data z okresního přeboru na to nejsou.

### 2.5 Kategorie jsou dynamické

**Kategorie mužstev se mění sezónu od sezóny.** Letos Muži + Dorost + Žáci + Stará garda,
příští rok třeba jen Muži + Žáci, přespříští starší a mladší žáci zvlášť. Návrh s tím počítá
tak, že **kategorie nejsou nikde vyjmenované** — odvozují se z dat.

| | Zdroj pravdy |
|---|---|
| Které kategorie klub má | `season/listCurrent?yearFrom` → sezóny daného ročníku, v jejichž `teamList` je tým s `own: true` |
| Pořadí v menu | `appConfig.categoryOrder` — jen seřazení kódů, ne výčet |
| Kde skrýt jména dětí | `appConfig.hideNamesAgeList` |
| Číselník všech možných kategorií | `AGE_MAP` v `server/config.js` (8 hodnot, statické) |

Důsledky pro klienta:

- **Menu se staví za běhu** z `season/listCurrent`, ne z konfigurace. Přidání kategorie =
  založení sezóny v administraci, ne nasazení.
- **Přepínač sezóny mění celou sadu kategorií**, ne jen data v jedné. Když v roce 2027 dorost
  nebude, na sezóně 2027 se v menu neobjeví — ale sezóna 2026 ho pořád má a odkazy fungují.
- **Routy jsou klíčované `teamId`, ne kategorií.** `team?id=<teamId>` přežije i to, že
  kategorie letos není aktivní; jen se dostane do archivního režimu.
- **Prázdné stavy jsou povinné.** Kategorie bez sezóny, sezóna bez zápasů, soutěž bez tabulky
  (stará garda) — každý z nich má definovaný text.
- Původní `appConfig.teams` (mapa `age → teamId`) **zaniká** — byl to statický výčet, tedy
  přesně to, co se má měnit.

---

## 3. Obrazovky

Rozvržení jednotlivých bloků a jejich vzhled popisuje
[ux-design-system.md](./ux-design-system.md), sekce 4; tady je datová stránka věci.

### 3.1 Home

Pořadí bloků podle předlohy (`mockups/desktop-01-home.jpg`):

| # | Blok | Data |
|---|---|---|
| 1 | Hero | statické (LSI + `assets`) |
| 2 | Statistiky | `appConfig` (rok založení, počet mužstev) |
| 3 | **Program víkendu** | `match/list?teamIdList&dateFrom&dateTo` – jeden dotaz za všechny kategorie, s odpočtem u nejbližšího |
| 4 | Poslední výsledky | `match/getLast` pro každou kategorii ze `season/listCurrent` |
| 5 | Aktuality | `article/list` (3 položky: foto, kategorie, datum, titulek, perex) |
| 6 | Tabulky | `stats/getTable` s přepínačem kategorie, vlastní tým zvýrazněn |
| 7 | CTA pruh | statické |
| 8 | Patička | `appConfig.contact` |

Bloky 3 a 4 nahrazují původně navržené jednotlivé dlaždice „poslední / příští zápas“ – předloha
je ukazuje **za všechna mužstva vedle sebe**, což je pro klub se třemi týmy užitečnější.
Pro `members` se u nejbližšího zápasu zobrazuje i odjezd.

Grid: `Uu5Elements.Grid` s `templateColumns={{ xs: "1fr", m: "repeat(3, 1fr)" }}`.

### 3.2 Novinky a detail článku

- Seznam: dlaždice s `photographUri`, štítky, titulkem, datem a `perex`; stránkování po 10
  (`article/list` `sectionList` nevrací — výpis ho nepotřebuje). **Stránka je v adrese**
  (`novinky?pageIndex`), ne ve stavu obrazovky: `/home-<n>` z v0 sem přesměrovává, takže na
  konkrétní stránku musí jít odkázat zvenčí.
- Detail: hlavička (titulek, datum, autor, foto) + obsah z `article.sectionList`, vykreslený
  přes **`Uu5.Content`** — sekce za sebou bez oddělovače (je to jeden text rozdělený kvůli
  editaci, ne kapitoly).
- Připnutá novinka (`priority > 0`) má červený proužek nahoře a drží špičku výpisu; **do RSS
  se ale řadí chronologicky** — připínání je vlastnost webu, čtečka čeká nahoře to nejnovější.
- Je-li vyplněn `matchId`, nad obsahem se zobrazí panel s výsledkem a odkazem na zápas.
- Pro `newsEditor` a výš je v hlavičce akce **Upravit** – jeden modal s formulářem článku,
  kde je `content` textové pole s `uu5codekitg01-forms`. **Zatím se edituje jako kód, ne WYSIWYG**
  (rozhodnuto 2026-09-06); rich-text přijde s ECC a bude to výměna jednoho vstupu.

### 3.3 Přehled mužstev (`teams`)

Karta na každou kategorii ze `season/listCurrent`: týmová fotka (`team.photoUri`) s popiskem
(`team.photoDesc`), odznak kategorie, název, perex (`team.desc`), řádky *soutěž* (přímo
z `season/listCurrent`, kde `competition` už je), *trenér*
(`coach/list?teamId&role=headCoach`), *tréninky* (`appConfig`), tlačítko na `team`.

`desc`, `photoUri` a `photoDesc` jsou **doplněk do entity `team`** (rozhodnuto 2026-09-06) —
do té doby karta tahle pole předlohy neměla odkud vzít. Chybí-li fotka, karta ji vynechá
a nesahá po klubovém erbu; erb je fallback loga, ne fotky.

### 3.4 Soupiska týmu (`team`)

- Přepínač sezóny (`season/list?teamId`).
- Sekce **Hráči** – `player/list?teamId&active=true`, dlaždice s fotem, číslem, postem
  a základní statistikou v sezóně; skupiny podle postu (brankáři, obránci, …).
- Sekce **Realizační tým** – `coach/list?teamId`.
- U mládeže **jména nechodí ze serveru** (`appConfig.hideNamesAgeList`, rozhodnuto
  2026-09-06). Klient tedy nic neschovává — jen musí umět vykreslit dlaždici hráče **bez
  jména**: číslo dresu, post, foto se nepoužije. Totéž platí pro sestavu na detailu zápasu
  a pro statistiky hráčů. Redakce (`CONTENT`) a hráč sám jména vidí.

### 3.5 Zápasy týmu

Tabulka `uu5tilesg02`: kolo, datum, domácí, hosté, výsledek (poločas v závorce),
příznak penalt, odkaz na detail. Filtr sezóny a přepínač „vše / doma / venku“.

### 3.6 Tabulka soutěže

Sloupce: pořadí, tým (logo + název), zápasy, V, VP, PP, P, skóre, rozdíl, body.
Vlastní tým zvýrazněn (`theme.color.accent` + červené pořadí). Na `xs` se skrývají sloupce
VP/PP a používá se `shortName`.

Soutěže bez penaltového rozstřelu (stará garda) tabulku nemají – místo ní se zobrazí
poznámka z předlohy („stará garda hraje svoji soutěž bez tabulky“).

### 3.7 Detail zápasu

- Hlavička: loga, název, skóre, poločas, penalty, kolo, datum, hřiště.
- **Sestavy** obou týmů (pouze vlastní tým má jmenné složení) – základ vs. střídající,
  góly, karty.
- **Střelci** – souhrn z `playerList`.
- **Ostatní výsledky kola** – `match/list?seasonId&round`, bez vlastního zápasu.
  Převzato ze současného webu, v původním návrhu chybělo.
- **Články** – `article/list?matchId`.
- **Fotogalerie** – `gallery/list?matchId`.
- Pro `members` navíc odjezd; pro `operatives` akce **Zapsat výsledek** a **Zapsat sestavu**.

### 3.8 Profil hráče

Osobní karta (jméno, foto, post, číslo, roky v klubu) + statistiky po sezónách
(`stats/getPlayerStats`) + poslední zápasy.

### 3.9 Fotogalerie

- Seznam alb: dlaždice s titulní fotkou, názvem, datem a počtem fotek; nad tím filtr kategorií
  (chipy z předlohy) přes `Uu5Forms.SwitchSelect`.
- Detail alba: mřížka náhledů (`thumbUri`, tj. binárka `w400`) s lightboxem
  (`Uu5Elements.Modal` + `UiElements.Image`, plná velikost `uri` binárky `w1600`),
  lazy loading přes `loading="lazy"` a `IntersectionObserver` pro dotahování stránek.

### 3.10 Ke stažení

Seznam z `file/list`, seskupený podle kategorie z `appConfig.fileCategoryList`;
řádek = ikona typu, název, datum, velikost, odkaz na `binary.uri`.

### 3.11 Obsahové stránky

`page/get?code=<code>` → pro každou položku `sectionList` jedna `Section`
s `Utils.Uu5String.toChildren(section.content)`. Členění na sekce je tedy zároveň
vizuální rytmus stránky, ne jen datový detail — kronikář jím řídí, kde se obsah zalomí.

Pro `contentEditor` a výš akce **Upravit** – jeden modal s `name`, `desc` a seznamem sekcí
(`uu5codekitg01-forms` na každou, přidat / odebrat / přesunout). Ukládá se **celý `sectionList`
najednou** přes `page/update`; přírůstkové operace nad jednotlivou sekcí neexistují.
**Zatím se edituje jako kód, ne WYSIWYG** (rozhodnuto 2026-09-06).

Stránky: `history`, `hymn`, `contact`, `board`, `training`, `team-photos`. Kódy jsou pevné —
míří na ně legacy přesměrování (sekce 2.1).

Obsah se **seeduje** z v0 (`tools/seed-pages.js`), aby web nešel do provozu se šesti
prázdnými stránkami. Kontakt obsahuje `<iframe>` mapy, výbor tabulku sedmi lidí — obojí je
součást `uu5String`, ne kód appky.

### 3.11.1 Historie jako časová osa

Historie je **svislá časová osa** s roky, jak ji ukazuje předloha (1932, 1948, 1972, 1992,
2005, 2012, 2022). Používá se **`Uu5Bricks.VerticalTimeline`** — hotová komponenta, nepíše
se vlastní.

Musí zůstat editovatelná redakcí, takže se komponenta **registruje do `uu5String`** a osa
je obsahem jedné sekce stránky `history`, ne natvrdo psaná komponenta:

Popisek položky je **`label`**, ne `header` (ověřeno proti `uu5bricksg01@1.25.1`); dál umí
`icon`, `colorScheme`, `significance` a `position`:

```
<Uu5Bricks.VerticalTimeline>
  <Uu5Bricks.VerticalTimeline.Item label="1932 · Založení klubu" icon="uugds-favorites" colorScheme="primary" significance="highlighted">
    Skupina nadšenců zakládá v Bratčicích Athletický fotbalový klub…
  </Uu5Bricks.VerticalTimeline.Item>
</Uu5Bricks.VerticalTimeline>
```

**Hotovo 7. 9. 2026:** balíček je `uu5bricksg01` a je v `client/package.json`; do import mapy
se dostane sám, protože `createViteConfig()` staví mapu z tranzitivního uzávěru `uu*`
závislostí klienta. Ověřeno v prohlížeči na `/historie`.

Cena je ale citelná: `uu5bricksg01` s sebou přitáhne dalších **28 `uu*` balíčků** a výstup
`public/libs` naroste z ~30 MB na **~120 MB** — sama komponenta je líná, ale do nasazení jde
všechno, co je v mapě. Největší kusy jsou `uu_uubmldraw_iconsg04` (51 MB) a starý
`uu5codekitg01-forms` (18 MB), které tenhle web nikdy nezobrazí. Až to začne vadit u deploye, jde
je vyřadit přes `client/uu5-imports.json`.

> **uu5g04 je zakázané.** Ani jako varianta, ani jako „hotové řešení, které by šlo
> přitáhnout“. Chybí-li komponenta, hledá se v uu5g05 řadě, nebo se napíše vlastní nad
> uu5g05.

### 3.11.2 Týmové fotky

`page?code=team-photos` — chronologie od roku 1943 po ročnících: fotka + jmenný seznam
sestavy pod ní. Je to obsahová stránka, ne album, protože popisky jsou dlouhé a struktura
(rok → mužstvo → dvě řady jmen) je součást obsahu. Odkazuje se z historie a patří k ní.

Fotky samotné jdou přes `BinaryStore` a do sekce se vkládají jako `UiElements.Image`.

### 3.12 Bez bočního panelu

Současný web má na každé stránce pravý sloupec (upozornění, poslední/následující zápas,
zkrácená tabulka). **Nová verze ho nemá** – je to vzor z dvousloupcových webů 2010, na mobilu
z něj stejně padá dlouhý ocas pod obsah a předloha ho nezná.

Obsah panelu se nezahazuje, jen se přesouvá tam, kam patří:

| Co bylo v panelu | Kam jde |
|---|---|
| **Upozornění!** (`appConfig.notice`) | úzký proužek pod horní lištou na všech stránkách – `Uu5Elements.Alert`, zavíratelný, stav v `sessionStorage` |
| **Poslední / následující zápas** | sekce *Program víkendu* a *Poslední výsledky* na home (3.1) |
| **Odpočet do zápasu** | do karty nejbližšího zápasu na home – `Countdown` zůstává, jen jinde |
| **Zkrácená tabulka** | sekce *Tabulky* na home s přepínačem kategorií |

---

## 4. Sdílené komponenty (`client/src/components/`)

| Komponenta | Popis |
|---|---|
| `layout/section.jsx` | Sekce s `maxWidth 1152`, gutterem a vertikálním paddingem; volitelně šrafovaný podklad |
| `layout/heading.jsx` | Eyebrow + `h2` s červeným svislým pruhem – tokeny z `theme.text` |
| `layout/card.jsx` | Karta na `theme.color.card` s 1px rámečkem, volitelný horní červený proužek |
| `layout/footer.jsx` | Třísloupcová patička + spodní řádek |
| `layout/notice-bar.jsx` | Proužek `appConfig.notice` pod lištou (`Uu5Elements.Alert`) |
| `countdown.jsx` | Odpočet do výkopu v kartě nejbližšího zápasu |
| `core/app-context.jsx` | `appConfig/get`, `season/listCurrent`, `team/list` → konfigurace, kategorie, menu, routy a **mapa týmů**; po přihlášení jednou zavolá `person/linkSelf` |
| `core/with-team-route.jsx` | Guard s prefixovou shodou nad `teamEditor:<teamId>` (`withRoute` to neumí) |
| `empty-state.jsx` | Jednotný prázdný stav seznamu – ikona, text z LSI, volitelná akce |
| `team-logo.jsx` | Logo z `binary.uri` + fallback na erb klubu |
| `match-tile.jsx` | Dlaždice zápasu (loga, skóre, datum) – použitá na home i v seznamech |
| `match-result.jsx` | Formátování výsledku včetně poločasu a penalt + výsledkový odznak |
| `standings-table.jsx` | Tabulka soutěže (kompaktní i plná varianta) |
| `season-select.jsx` | `Uu5Forms.Select` sezón pro daný tým/kategorii |
| `team-select.jsx` | Výběr týmu ve formulářích (s logem) |
| `person-select.jsx` | Vyhledávací výběr osoby (`person/list?query`) |
| `player-tile.jsx` | Karta hráče |
| `article-tile.jsx` | Dlaždice novinky |
| `photo-grid.jsx` | Mřížka fotek s lightboxem |
| `round-results.jsx` | „Ostatní výsledky N. kola“ na detailu zápasu |
| `date-text.jsx` | Jednotné formátování data a času (cs-CZ) |

Kompletní rozpad obrazovek na komponenty včetně toho, co dodává uu5 a co si píšeme sami,
je v [component-tree.md](./component-tree.md).

**Mapa týmů v `app-contextu` je nutnost, ne optimalizace.** `match/list` vrací jen
`homeTeamId` / `guestTeamId` — týmy dotahuje pouze `match/get`. Každá dlaždice a řádek
zápasu přitom potřebuje název a logo, takže by jinak každá obrazovka se seznamem zápasů
řešila to samé zvlášť. Klub má desítky týmů včetně soupeřů, takže `team/list` jednou při
startu SPA je levnější než denormalizace názvů do každého zápasu.

Upload souborů se **nedělá vlastní komponentou** – používá se `UiElements.FormFile` z `caio-ui`
(existující hodnota se ukáže jako `Uu5Forms.Link` s křížkem, `accept="image/*"` přepne na
`Uu5Imaging.ImageInput`).

---

## 5. Načítání dat

- Seznamy s CRUD: `UiElements.CrudContext.create("<entity>")` → `[Provider, useHook]`
  navázané na konvenci `entity/list|create|createMany|update|delete|deleteMany`.
  Props `Provider`u: `dtoIn` (filtr, re-load při změně), `pageSize` (default 1000),
  `calls` (override, když endpoint nesedí na konvenci), `refreshKey`.
- Soubory: `UiElements.BinaryProvider` / `useBinary` (už hotová dvojice nad `binary/*`).
- Jednotlivé objekty a nestandardní use casy: `useDataObject` +
  `UiElements.Call.cmdGet/cmdPost`.
- Obsah (`article`, `page`): obyčejný `useDataObject` nad `article/get` / `page/get`.
  Stránka přijde i se `sectionList`, takže druhé volání na sekce není. `UiEcc` se
  **nepoužívá** – viz [api.md](./api.md), 2.9.
- Chyby: `ErrorBoundary` ve `Spa` + `AlertBus` pro nefatální chyby (`Uu5Elements.useAlertBus`).

**Stránkování stojí na `pageInfo` v `dtoOut`**, který se doplňuje do `caio-server`
(rozhodnuto 2026-09-06, [api.md](./api.md), 1.0.1). Do té doby `UiElements.Crud` neví, kolik
je celkem záznamů, a `loadNext` si o další stránku neřekne — seznamy jedou na jednu dávku
`pageSize: 1000`. Netýká se to jen administrace: stránkování novinek (`news?pageIndex`)
a dotahování fotek v albu na tom stojí taky.

`UiElements.Call` posílá vždy `credentials: "include"`; `post` odešle `FormData` automaticky,
jakmile je v `dtoIn` `File`.

---

## 6. Správcovské obrazovky

### 6.1 Vzor

Znovupoužívá se `UiElements.Crud` z `caio-ui`: konfigurační objekt popíše sloupce,
filtry, řazení i formulářové vstupy, komponenta z něj vygeneruje tabulku, modal
pro create/update, hromadné mazání a akci „zobrazit data / zkopírovat ID“.

```jsx
import { UiElements } from "caio-ui";
import Uu5Forms from "uu5g05-forms";

const [TeamProvider, useTeam] = UiElements.CrudContext.create("team");

const CONFIG = {
  logo: {
    label: { cs: "Logo" },
    output: (value, item) => <TeamLogo uri={item.data.logoUri} height={32} />,
    columnProps: { maxWidth: 84 },
    input: { Component: UiElements.FormFile, props: { accept: "image/*" } },
  },
  name: {
    label: { cs: "Název" },
    sort: true,
    input: { Component: Uu5Forms.FormText, props: { required: true } },
  },
  age: ageConfig,
};

const { seriesList, columnList, sorterList, filterList } = UiElements.Crud.generate(CONFIG);

<TeamProvider>
  {(dataList) => (
    <UiElements.Crud
      header={<Lsi import={importLsi} path={["admin", "teams", "header"]} />}
      dataList={dataList}
      seriesList={seriesList}
      columnList={columnList}
      sorterDefinitionList={sorterList}
      filterDefinitionList={filterList}
    >
      {() => UiElements.Crud.generateInputs(CONFIG)}
    </UiElements.Crud>
  )}
</TeamProvider>
```

Bez `children` je `Crud` read-only tabulka. Výběr řádků odemkne hromadné mazání
(`entity/deleteMany({ idList })`). `compact` přesune akce do „…“ menu, když jsou řádky úzké.

**`admin/files` není holá `UiElements.BinaryCrud`.** Ta kolekci umí (`collection="file"`),
ale je záměrně nerozšiřitelná přes props — a veřejná stránka „Ke stažení" seskupuje podle
`category` a řadí podle `date`, což jsou pole, která by tak nikdo nezapsal. `admin/files`
si proto skládá **vlastní `Crud` konfiguraci nad `UiElements.BinaryProvider`** (kolekce
`download`) se dvěma poli navíc: `category` jako `Uu5Forms.Select` z `appConfig.fileCategoryList`
a `date`. Zbytek sloupců (název, velikost, typ, odkaz) se opíše z `BinaryCrud` —
je to přesně ta cesta, kterou README `caio-ui` pro tenhle případ předepisuje.

Popisky tlačítek a dialogů `Crud`u jsou z LSI `caio-ui` (`src/lsi/cs.json`) – aplikace do nich
nesahá; potřebuje-li jiné znění, skládá si vlastní konfiguraci.

### 6.2 Obrázky před uploadem

GCS náhledy negeneruje, takže se obrázek zmenší a převede na WebP **na klientu**:

```js
const { imageFile } = await Uu5ImagingTools.Adjustment.resizeMax(file, 400);   // logo
const { imageFile: webp } = await Uu5ImagingTools.Adjustment.changeType(imageFile, "webp", 0.75);
```

Doporučené šířky: logo 400 px, portrét osoby 600 px, titulní foto článku 1200 px,
týmová fotka 1200 px, fotka v galerii **1600 px (plná) + 400 px (náhled)** – u galerie
se nahrávají obě.

### 6.3 Hromadné vytvoření zápasů

`UiElements.Crud` nabízí u akce „Vytvořit“ položku **Hromadně** – modal s JSON editorem
(`uu5codekitg01-forms`), který volá `match/createMany`. Slouží k naimportování rozlosování
staženého ze stránek OFS.

### 6.4 Zápis výsledku a sestavy

Samostatný modal nad detailem zápasu:

- **Výsledek** – skóre, poločas, přepínač „rozhodly penalty“ + výběr vítěze rozstřelu.
- **Sestava** – tabulka hráčů týmu s inline vstupy: post, střídající, góly, žlutá, červená
  (odpovídá formuláři v0 `editZapas.php`, ale bez ručního psaní loginů).

### 6.5 Hromadný upload fotek

Sekvenční volání `gallery/addPhoto` s ukazatelem průběhu; pro každou fotku se nahrají dvě
binárky (plná + náhled). Sekvenčně kvůli limitu `BINARY_MAX_FILES` (20 souborů na request)
a velikosti `BINARY_MAX_FILE_SIZE_MB` (25 MB na soubor).

---

## 7. Texty (LSI)

Povinná struktura z `caio-devkit` (scaffold ji zakládá):

```
client/src/lsi/
  import-lsi.js     IMPORT_BY_LANGUAGE – výčet jazyků (Vite neumí dynamický import adresáře)
  cs.json           zdroj pravdy, jediný plněný jazyk
```

**Zatím jen čeština.** `languageList = ["cs"]`, `en.json` se nezakládá — prázdný soubor by jen
předstíral, že něco umíme. Přidání jazyka je pak `en.json` + řádek v `IMPORT_BY_LANGUAGE`
+ `"en"` v `languageList`; struktura klíčů se nemění, takže to není refaktor.

**Obsah v ECC je připravený na víc jazyků už teď** — sekce ukládá `contentMap: { cs: uu5String }`,
ne holý string (viz [data-model.md](./data-model.md), sekce 10). Redakce dnes plní jen `cs`,
ale datový model se kvůli druhému jazyku měnit nebude.

```jsx
<Lsi import={importLsi} path={["home", "matches", "header"]} />
const header = useLsi(importLsi, ["home", "matches", "header"]);
const homeLsi = useLsi(importLsi, ["home"]);
```

Klíče se seskupují po obrazovkách. Parametry se píšou jako `${nazev}` a doplňují propem
`params` nebo `Utils.String.format`.

---

## 8. Vzhled a UX

Kompletní tokeny, škála písma a překlad předlohy do uu5 komponent jsou v
[ux-design-system.md](./ux-design-system.md). Shrnutí:

- Tmavé schéma, klubová červená `#D01319`, žádná čistá černá ani bílá.
- **Velikosti písma vždy z uuGds** přes `Uu5Elements.Text` (`category`/`segment`/`type`).
  V `theme.js` není jediné `fontSize`; GDS řeší i mobilní stupně sám (`smallScreen`).
- Písma Bebas Neue (nadpisy, `uppercase`, prostrkání +4 %) a Barlow (text).
- Šířka obsahu 1152 px, sekce 64 px vertikálně, karty s 1px rámečkem bez stínů.
- Mobile-first: `useScreenSize()`, `Uu5Elements.Grid` s breakpointy `xs/s/m/l`.
- Prázdné stavy: každý seznam má definovaný text pro „žádná data“ (v0 na to nemyslel).
- Skeletony (`Uu5Elements.Skeleton`) místo spinnerů u obsahových bloků.

---

## 9. PWA, ikony a meta

`caio-devkit` má vestavěný PWA plugin; aktivuje se, jakmile existuje
`client/public/assets/meta/manifest.json`. **Jména souborů jsou pevná:**

| Soubor | Rozměr / formát |
|---|---|
| `assets/meta/manifest.json` | jméno, popis a barvy appky |
| `assets/meta/icon-192.png` / `icon-512.png` | 192×192 / 512×512, motiv do krajů |
| `assets/meta/icon-maskable.png` | 512×512, motiv v safe zóně (kruh 80 % šířky) |
| `assets/meta/apple-touch-icon.png` | 180×180, bez průhlednosti |
| `assets/meta/icon.svg` | volitelný vektor |
| `assets/meta/og-image.jpg` | 1200×630 (1,91:1) |
| `public/favicon.ico` | 16+32 v jednom |

Zdrojem je klubový erb; `theme_color` = `#D01319`, `background_color` = `#070404`.
Devkit z těchto souborů plní i přihlašovací stránku `/login.html`.

---

## 10. SEO a meta

- `index.html` obsahuje základní meta a OG tagy; detailní stránky (článek, zápas)
  je aktualizují za běhu (`document.title`, `og:title`, `og:image`, `og:description`
  z `perex`).
- `GET /rss` a `GET /sitemap.xml` obsluhuje server (viz [api.md](./api.md), sekce 4).
- Staré URL se přesměrovávají na serveru – viz [migration.md](./migration.md), sekce 5.
- Klientský routing je hash-free (`history` API). SPA fallback zajišťuje `caio-server`:
  cesta bez přípony → `index.html`, cesta s příponou → 404.

---

## 11. Výkon

| Opatření | Popis |
|---|---|
| Lazy routy | `Utils.Component.lazy` + `Suspense` (z v1) |
| Stránkování | `pageInfo` u zápasů, článků a fotek |
| Náhledy | vlastní binárka `w400` – GCS náhledy negeneruje (viz [README.md](./README.md), sekce 3.1) |
| Denormalizace | `team.logoUri`, `gallery.photoCount`, `gallery.coverThumbUri` – šetří dotazy v seznamech |
| Cache konfigurace | `appConfig/get`, `season/listCurrent` a `team/list` se volají jednou při startu SPA |
| uu5 mimo bundle | `uu5loaderg01` je stahuje z `public/libs/` – appkový bundle je malý |

---

## 12. Stav proti serveru (revize 2026-09-06)

Serverová dávka z 6. 9. pokrývá sportovní jádro, galerii, soubory, konfiguraci a SEO trasy.
Tahle tabulka říká, co z frontendu na čem stojí — aby se implementace nerozjela proti
neexistujícímu endpointu.

| Obrazovka / blok | Server | Stav |
|---|---|---|
| Home – hero, statistiky, CTA | `appConfig/get` | ✅ |
| Home – program víkendu | `match/list?teamIdList&dateFrom&dateTo` | ✅ (potřebuje mapu týmů) |
| Home – poslední výsledky | `match/getLast` per kategorie | ✅ |
| Home – tabulky | `stats/getTable` | ✅ vč. bodování na penalty a sloupce `form` |
| Home – aktuality | `article/list` | ✅ **hotovo na klientu** (3 nejnovější; blok se bez článků nevykreslí) |
| Mužstva, soupiska, realizační tým | `season/listCurrent`, `player/list`, `coach/list` | ✅ (fotka a perex až s `team.photoUri`/`photoDesc`) |
| Zápasy týmu, detail zápasu (sestavy, střelci, ostatní výsledky kola, H2H) | `match/list`, `match/get` | ✅ **hotovo na klientu** |
| Odběr kalendáře | `GET /calendar/team-<id>.ics` | ✅ |
| Tabulka soutěže | `stats/getTable` | ✅ **hotovo na klientu**; bodovací model říká `season.hasPenalties` |
| Statistiky hráčů | `stats/listPlayerStats` | ✅ **hotovo na klientu** |
| Profil hráče – karta a sezóny | `player/get`, `stats/getPlayerStats`, `season/list?idList` | ✅ **hotovo na klientu**; `idList` doplněn 2026-09-06 |
| Profil hráče – poslední zápasy | `match/list?playerId` | ✅ **hotovo na klientu**; filtr `playerId` doplněn 2026-09-06 |
| Fotogalerie (alba, filtr kategorií, lightbox) | `gallery/list`, `gallery/listPhotos` | ✅ **hotovo na klientu** |
| Ke stažení | `file/list?category` | ⚠️ `category` nikdo nezapisuje, dokud nevznikne `admin/files` (6.1) |
| Obsahové stránky | – | ✅ **natvrdo v klientu**, entita `page` čeká na ECC |
| Novinky, detail článku, RSS | `article/*`, `GET /rss` | ✅ **hotovo na klientu i serveru** |
| `admin/*` CRUD | `*/create|update|delete` | ✅ pro existující entity |
| `admin/identities` | `identity/adminList`, `identity/update` | ✅ na profilu `authorities` |
| Přihlášení, registrace, reset hesla | `caio-server-auth` + `/login.html` | ✅ |
| Stránkování čehokoli | `pageInfo` v `dtoOut` | ✅ `Dao.findPage()` v `caio-server`; v appce ho zatím používá `article/list` |

Legenda: ✅ server to umí · ⚠️ jde postavit, ale s omezením · ⏳ čeká na doplnění.
