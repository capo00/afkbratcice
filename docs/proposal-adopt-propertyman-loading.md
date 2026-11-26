# Návrh: převzít z propertymanu zlepšení načítání

Stav: **návrh k odsouhlasení** (2026-11-26). Nic není implementované, nic se necommitovalo.
Podklad: `caio_propertyman/docs/proposal-loading-performance.md` (sekce 5, 9, 10), commity propertymanu
`2d70a4a`, `54754af`, `e0aa860`, `c91615b`, a sdílené knihovny caio-ui 0.4.13 (`5802dea`) a caio-server
0.8.2 (`2fefbab`). Todo: `caio-personal/todo/afk-adopt-propertyman-loading.md`.

Naměřená data a skripty leží mimo repo ve sdílené složce session
(`…\side-session-notes\local_ffeaff88-25cc-4fd3-a175-b8b4313ff9bf\afk-adopt-pm\`, viz [Příloha](#příloha-data-a-skripty)).

---

## 1. Shrnutí

- **Většina toho, co propertyman „přidal“, pochází z AFK a AFK to už má:** zpožděné spinnery (bod 3),
  boot screen v administraci (bod 7), `Deferred` na home. Nového je pro AFK jen přechod na **sdílené
  verze** (caio-ui 0.4.13 boot screen, caio-server 0.8.2 cache) a dva vzory: rezerva podle skutečné výšky
  a `BelowFold` na dlouhých routách.
- **CLS produkce 0.12.5 je 0 na 12 z 15 měřených rout.** Skáčou tři, žádná z hlavních:
  - **`/tymove-fotky`: 0,126 mobil, 0,109–0,164 desktop** (pásmo „poor“). 53 `<img>` bez `width`/`height`;
    jakmile dorazí hlavička první fotky, text pod ní sjede o 186 px (mobil) / 323 px (desktop). Oprava
    je pár řádků (rozměry fotek jsou známé, 600 × 337/338).
  - **`/muzstva`: 0,031 mobil, 0,014 desktop.** Karta drží místo jen pro jeden řádek trenéra; mužstvo
    s více trenéry po `management/list` naroste o 48 px a posune karty pod sebou.
  - `/vybor`: 0,004 / 0,003 (rezerva 240 px proti 543 px výboru; zanedbatelné).
- **Galerie (bod 6) na webu dnes není** (routy odpojené 2026-11-19), `uu5imagingg01` web nenačítá vůbec.
  Převzít až s návratem galerie.
- **Lighthouse dnes nejde srovnat s 0.12.5:** stroj běží na baterii a hlavní vlákno je ~1,5× pomalejší
  (TBT home mobil 3–4 s místo 0,6–0,9 s). Kalibraci na propertymanu a čísla rout uvádím v kap. 3.2;
  porovnání před/po se musí dělat na síti a ve stejném stavu stroje.
- **Bod 5 má smysl jen na `/sezona`** (TBT mobil 4,8 s: render ~26 kol zápasů najednou). Holý
  `UiElements.Deferred` stačí, `BelowFold` z propertymanu ne: AFK drží patičku pod ohybem obalem routy.
- **Odhad ≈ 2,25–2,6 d** (bez galerie, včetně caio-serveru 0.8.3), jedno vydání AFK. Lighthouse se tím výrazně nepohne (strop dělá
  inicializace uu5, stejně jako v propertymanu); přínos je CLS 0 všude, nižší TBT `/sezona`, jedna
  sdílená kopie boot screenu a rychlejší opakované návštěvy.

---

## 2. Jak jsem měřil

Stejná metodika a skripty jako propertyman (`cls.mjs`, `run.mjs`, `lh.sh` z jeho přílohy):

- **CLS na routách:** CDP v Edge headless, **slow 4G** (1,6 Mbit/s, 150 ms RTT) + **CPU 4×**, vypnutá
  cache, viewporty **390×844** a **1366×768**, CWV okna (mezera ≤ 1 s, okno ≤ 5 s). Hlavní routy (`/`,
  `/muzstvo`, `/zapas`, `/sezona`, `/historie`) 3 běhy, ostatní 1 běh; `/`, `/tymove-fotky`, `/historie`
  a `/sezona` navíc se scrollem (`SCROLL=1`).
- **Lighthouse 13.5** v Edge headless: mobil se simulovaným zpomalením (home 3 běhy, ostatní 1), desktop
  preset (home 3 běhy), mobil se skutečným zpomalením (`devtools`, 1 běh). Výkon a přístupnost.
- **Produkce** `https://afkbratcice.cz` 0.12.5, jen GET stránek zvenku; databáze nedotčená. Lokální build
  jsem neměřil: lokální server neposílá gzip a pro výchozí stav stačí produkce.
- **Omezení:** jedna kopie dat (sezóna, zápas, mužstvo A), jeden profil sítě; **stroj na baterii**
  (viz 3.2), takže absolutní TBT a skóre Lighthouse jsou horší než při měření 0.12.3–0.12.5.

---

## 3. Výchozí stav (produkce 0.12.5)

### 3.1 CLS na routách (slow 4G + CPU 4×, první návštěva, CWV okna)

| Routa | Mobil 390 | Desktop 1366 | Co se hýbe |
|---|---:|---:|---|
| `/` (3 běhy, + scroll) | 0 | 0 | nic, ani při scrollu (odložené sekce jsou pod ohybem) |
| `/muzstvo`, `/zapas`, `/sezona`, `/historie` (3 běhy; `/sezona` a `/historie` + scroll) | 0 | 0 (1× 0,0015) | 0,0015 = cuknutí kruhu boot screenu (`div.mark`, jako v propertymanu) |
| `/muzstvo/zapasy`, `/tabulka`, `/statistiky` | 0 | 0 | — |
| `/kontakt`, `/zajimavosti`, `/hymna`, `/admin/` | 0 | 0 | — |
| **`/tymove-fotky`** (+ scroll) | **0,126** | **0,109–0,164** | odstavce pod první fotkou o 186 / 323 px: `<img>` bez rozměrů |
| **`/muzstva`** | **0,031** | **0,014** | karty pod mužstvem s více trenéry o 48 px (`management/list`) |
| `/vybor` | 0,004 | 0,003 | karta výboru o 5 px při výměně skeletonu 240 px za obsah |

Proti stavu po fázi 1 (`proposal-section-loading.md`) nic nového nevzniklo: `/muzstva` je zbytek A4
(dřív 0,165, rezerva jednoho řádku ho stáhla na 0,031) a `/tymove-fotky` se dřív neměřily.

### 3.2 Lighthouse

**Stroj běžel na baterii** (`Win32_Battery` BatteryStatus 1), hlavní vlákno je proto pomalejší než při
měření 0.12.3–0.12.5. Kalibrace stejným skriptem hned po AFK na produkci propertymanu 0.3.3, kde jsou
čísla známá z jeho návrhu (kap. 10, měřeno 2026-11-25):

| | Propertyman 0.3.3 home, jeho měření | Propertyman 0.3.3 home, dnes | AFK 0.12.5 home, dnes |
|---|---|---|---|
| Mobil (simulovaný) | 51–54, TBT 700–820 ms | **40–41**, TBT 3,9–4,3 s | **42–43**, TBT 3,0–4,0 s |
| Desktop | 85–86 | **55–58**, TBT 790–900 ms | **60–75**, TBT 370–790 ms |

Dnešní čísla jsou tedy o ~10 bodů (mobil) a ~25–30 bodů (desktop) horší jen kvůli stroji; AFK vychází
stejně nebo lépe než propertyman, regrese proti 0.12.5 vidět není. Absolutní srovnání s 0.12.5
(desktop 79–93, mobil 53–56 podle zadání; `proposal-mobilni-vykon.md` kap. 7) nedělám. **Před/po se
musí měřit ve stejném stavu stroje, ideálně na síti.**

| Routa (produkce 0.12.5, dnes) | Mobil | Desktop | Pozn. |
|---|---|---|---|
| `/` (3 + 1 běh) | 42–43, LCP 7,7–8,4 s, TBT 3,0–4,0 s | 60–75, LCP 1,7–1,9 s, TBT 370–790 ms | LCP = h1 v hero (render delay) |
| `/` mobil, skutečné zpomalení | 0 (LCP 21,5 s, TBT nezměřeno) | | na baterii nepoužitelné |
| `/muzstvo` | 72, LCP 1,2 s, TBT 1,8 s | 79 | |
| `/zapas` | 69, LCP 1,3 s, TBT 2,4 s | 72 | |
| `/sezona` | 68, LCP 1,3 s, **TBT 4,8 s** | 68, **TBT 1,2 s** | render kol, viz D |
| `/historie` | **43, LCP 9,0 s**, TBT 6,1 s | 63, LCP 1,9 s | osa skrytá do změření všech položek |
| `/admin/` | 71 | 76 | |

Přístupnost 95–100 (home a `/sezona` mobil 95, jinak 100). Hlavní vlákno home: `uu_gdsg01-unicorn`
jedním blokem 2,9 s (mobil) / 0,6 s (desktop), `react-dom` 0,8 s / 0,26 s; obraz stejný jako
v `proposal-mobilni-vykon.md` M4 a v propertymanu.

### 3.3 Cache (produkce)

Všechny statické soubory mají `Cache-Control: public, max-age=0` a `Last-Modified: 1980-01-01`
(App Engine), stejně jako propertyman před 0.8.2 (`curl -I` na `/libs/uu5g05/…`, `/index.js`).
Opakovaná návštěva tedy revaliduje každý z ~50 souborů startu.

---

## 4. Kandidáti proti současnému AFK

| # | Kandidát | Platí pro AFK? | Návrh |
|---|---|---|---|
| 1 | Sdílený boot screen (caio-ui 0.4.13) | **ano**, AFK má vlastní kopii | převzít (A) |
| 2 | caio-server 0.8.2 (immutable cache) | **ano**, AFK má ^0.8.1 | převzít (B) |
| 3 | Zpožděné spinnery (`delayed-appear`) | **už hotovo** (AFK je originál, `0ab99ce`) | nic; jen otázka, jestli do caio-ui (Q4) |
| 4 | Rezervy podle skutečné výšky | **ano**, `/tymove-fotky`, `/muzstva`, okrajově `/vybor` | převzít (C) |
| 5 | `BelowFold` pod první obrazovkou | **částečně**: AFK má obal routy na výšku okna (A1), stačí holý `Deferred` | jen kde to ukáže profil (D) |
| 6 | Fotky `<img>` + `srcset`, `uu5imagingg01` v idle | **dnes ne**: galerie na webu není | až s návratem galerie (E) |
| 7 | Boot screen v administraci | **už hotovo** (`admin/index.jsx` `renderApp`, `BootReady` po session) | nic, přejde s bodem 1 |

### A. Sdílený boot screen z caio-ui 0.4.13 (bod 1)

`caio-ui/src/caio-ui-app/boot-screen.jsx` je kopie `client/src/core/boot-screen.jsx` s parametry:
písma první obrazovky přicházejí volbou (`fontList`, `fontSample`), `scrollbar-gutter: stable` nastaví
sám, má ošetřený chybějící `#root` a `SpaError` z caio-ui obsahuje `BootReady`. Chování (pojistka 20 s,
čekání na písma a ikony lišty max. 1,5 s, `inert`, `onUncaughtError`, prolnutí 100 ms) je stejné.

Změny v AFK:

- `client/package.json`: `caio-ui` `^0.4.13`.
- Nový `client/src/tools/boot-options.js`: `BOOT_OPTIONS = { fontList: [Bebas Neue 400, Barlow 400/600/700],
  fontSample: "AFK BRATČICE afk bratčice" }` (dnešní `FONT_LIST`/`FONT_SAMPLE`).
- `main.jsx`, `admin/index.jsx`: `UiApp.renderApp(<App />, BOOT_OPTIONS)` místo vlastního `renderApp`.
- `router.jsx`, `admin/app.jsx`, `components/layout/app-error.jsx`, `core/app-context.jsx`:
  `UiApp.BootReady` a `UiApp.useBootScreenActive` místo importu z `core/boot-screen.jsx`.
- **Smazat `client/src/core/boot-screen.jsx`**; komentáře, které na něj odkazují (`app.jsx`,
  `page-loading.jsx`, `theme-setup.js`, `app-context.jsx`), přepsat na caio-ui. `scrollbarGutter`
  v `theme-setup.js` může zůstat (caio-ui ho nastaví taky, neškodí) nebo pryč.

**Boot screen se musí pustit i při chybě.** Cesty, kudy dnes chyba vede, zůstávají a jen mění import:

| Chyba | Kdo pustí boot screen |
|---|---|
| render v routě, v `Shell` (`UiApp.Spa` s `errorFallback={AppError}`) | `AppError` má `BootReady`; `SpaError` z caio-ui se v AFK nepoužívá, `errorFallback` ho nahrazuje |
| `AppProvider` nebo lišta (`ErrorBoundary` nad `AppProvider` v `app.jsx`) | `AppError` |
| úvodní dotazy selžou (`errorNoData` v `AppProvider`) | `BootReady` v chybové obrazovce |
| chyba mimo všechny hranice (`SpaProvider`, `ErrorBoundary` samotná) | `onUncaughtError` v `UiApp.renderApp` |
| nic z toho (visí `Suspense`, nekonečné načítání) | pojistka 20 s |

**Pozor při přechodu:** stav boot screenu je v modulu. Všechny importy (`renderApp`, `BootReady`,
`useBootScreenActive`) musí přejít v jednom kroku. Kdyby jeden `BootReady` zůstal z lokálního souboru,
pouštěl by jiný (nedržený) boot screen a stránka by čekala na pojistku 20 s.

- **Odhad 0,25 d** + 0,25 d ověření (filmový pás startu webu i adminu; chyba startu: zablokovat
  `season/listCurrent` v CDP a ověřit chybovou obrazovku bez čekání na pojistku).
- **Přínos:** pro návštěvníka žádná změna (stejná logika); −200 řádků v AFK, jedna kopie pro obě appky,
  opravy boot screenu dál jen v caio-ui.

### B. caio-server 0.8.2: dlouhá cache verzovaných souborů (bod 2)

- `package.json`: `caio-server` `^0.8.2`, `npm install`. Nic dalšího: pravidlo je v `express.static`
  caio-serveru (`services/static-cache.js`).
- Na dnešním buildu AFK (`public/`, 2113 souborů) by pravidlo dalo **immutable 2028 souborům**
  (`libs/<knihovna>/<verze>/…`, `chunks/*-<hash>.js`, 2 hashované obrázky v `assets/`). Dál revalidovaných
  zůstane 85: HTML, `index.js`, `admin.js`, `login.*`, `libs/_shim/` (2), `assets/fonts/` (8),
  `assets/teams/` (53 týmových fotek), `assets/meta/`, ikony a **`assets/vendor/react*/19.1.9/` (3)**.
- **React a react-dom** jdou do prohlížeče z `client/src/assets/vendor/<knihovna>/19.1.9/` přes
  `client/uu5-imports.json` (dočasně kvůli uu5g05 alfě s Reactem 19, `52251d9`). Pravidlo 0.8.2 je
  nepokryje; propertyman má totéž a na produkci tam react-dom (largest skript startu) zůstal
  `max-age=0`. Řešení patří do caio-serveru (vzor `assets/vendor/<knihovna>/<verze>/`), ne do AFK
  (otázka Q3). Písma v `assets/fonts/` jsou stejný případ (i v propertymanu `max-age=0`).
- **Rozhodnutí Q3 (Caio 2026-11-26):** React i písma dostanou dlouhou cache, pokud mají v cestě
  verzi. Proto krok **B2**:
  - **caio-server 0.8.3:** do `IMMUTABLE_PATTERN_LIST` přidat vzor
    `assets/vendor/<název>/<verze>/` (`^assets\/vendor\/[^/]+\/\d+\.\d+\.\d+[^/]*\/`), stejný tvar
    jako `libs/<knihovna>/<verze>/`. Pokryje React a písma. Připsat test do `static-cache` testů
    a vydat caio-server.
  - **Písma v AFK** (Caio 2026-11-26) přesunout do vendor cest stejně jako knihovny:
    `assets/vendor/bebas-neue/<verze>/…` a `assets/vendor/barlow/<verze>/…`. Upravit `fonts.css`,
    preload a `FONT_LIST` boot screenu se nemění (jde o rodiny, ne cesty). Verze bude verze
    písma (z Google Fonts/fontsource, ověřit při implementaci), jinak `1.0.0`. Při změně souborů
    se verze zvedne.
  - **Propertyman** dostane React s dlouhou cache bumpem na 0.8.3. Jeho písma jsou mimo tento
    návrh (follow-up v propertymanu).
  - Týmové fotky (`assets/teams/`) zůstanou revalidované. Mění se zřídka a týkají se jedné stránky.
- **Odhad 0,1 d** + ověření hlaviček po vydání (`curl -I`).
- **Přínos:** opakovaná návštěva bez ~45 revalidací startu (na mobilu několik kol po RTT). Lighthouse
  (první návštěva) beze změny.
- Mimo caio-server: loga týmů v bucketu (`storage.googleapis.com`, `max-age=3600`) řeší
  `proposal-mobilni-vykon.md` M5, ne tenhle návrh.

### C. Rezervy podle skutečné výšky (bod 4)

**C1. Týmové fotky s rozměry** (`content/page-content.js`, `teamPhotoBlock`):

- `<img … width="600" height="337">` (rozměry v `team-photos.js` u položky, nebo jeden rozměr pro
  všechny: všech 53 má 600 px, výška 337–338). `Prose` už má `img { max-inline-size: 100%;
  block-size: auto }` (`prose.jsx:35`), takže s atributy drží poměr i zúžená fotka. Pozor, ať
  `Uu5.Content` (uu5String) atributy `width`/`height` u `<img>` propustí. Test `team-photos.test.js` může rozměry ze souborů ověřit (čte už
  složku `assets/teams/`).
- Volitelně první fotka bez `loading="lazy"` a s `fetchpriority="high"`: je to LCP stránky a dnes se
  stahuje současně s pěti dalšími.
- **Odhad 0,25 d. Přínos:** CLS `/tymove-fotky` 0,13–0,16 → 0.

**C2. Karta mužstva drží místo pro skutečný počet trenérů** (`routes/teams.jsx`):

Dnes rezerva jednoho řádku; trenérů bývá víc. Možnosti:

- **a) Trenéři rovnou v úvodních datech** (**schváleno, Caio 2026-11-26**): `season/listCurrent`
  přidá ke každé položce `coachList`, tedy aktivní trenéry mužstva s osobou. Počítá je server při
  dotazu: jeden `managementDao.listByFilter` s `role: "coach"`, `active: true` pro všechna `teamId`
  najednou, pak `_withPerson` jako `management/list`. **Data ani model v DB se nemění**, nic se
  neukládá navíc. Karta má trenéry od prvního vykreslení, zmizí čtyři dotazy `management/list`
  a celá druhá vlna. Daň: `season/listCurrent` je v úvodních datech každé stránky, takže každý
  start má o jeden dotaz do Monga víc (index `teamId + role` existuje) a o pár set bajtů větší
  odpověď. Změna serveru (crud + test), klient se zjednoduší.
- b) Bez serveru: do příchodu trenérů celou mřížku karet vykreslit neviditelně (`visibility: hidden`,
  místo drží obal routy A1) a ukázat najednou. CLS 0, ale karty se objeví o jeden dotaz později.
- c) Jeden dotaz `management/list?role=coach&active=true` pro všechna mužstva místo čtyř. Méně
  požadavků, ale posun zůstane.
- **Odhad a) 0,5 d, b) 0,25 d. Přínos:** CLS `/muzstva` 0,031 → 0.

**C3. `/vybor`** (`components/board.jsx`, `DataState height={240}`): rezerva podle počtu členů výboru
nejde (počet přichází s daty). Posun 5 px dělá jen rozdíl odsazení skeletonu a obsahu, CLS 0,004.
**Nedělat**, pokud to nevyjde samo s C2 b).

Ostatní rezervy (`DataState` 160–320 px na home, mužstvu, zápase, sezóně) CLS nedělají: obsah je
pod ohybem, nebo nahrazuje skeleton jako celek a pod ním je jen patička, kterou drží A1.

### D. `Deferred` pod první obrazovkou na dlouhých routách (bod 5)

Propertyman potřeboval `BelowFold` (`Deferred` + plocha na výšku okna), protože nemá obal routy s min.
výškou. **AFK ho má (A1, `router.jsx` `ROUTE_HEIGHT`)**, takže stačí holý `UiElements.Deferred` jako
na home; vlastní komponenta navíc není potřeba.

Profil z Lighthouse mobil (3.2, nejdelší úlohy hlavního vlákna) ukazuje, kde má smysl:

| Routa | TBT mobil | Největší bloky | Návrh |
|---|---:|---|---|
| **`/sezona`** | **4,8 s** | `uu5g05` 2,1 s + `react-dom` 0,9 s: commit po příchodu dat, tabulka + ~26 kol × ~7 `MatchTile` najednou | **`Deferred` kolem sekce kol** (tabulka a nadpis hned). Nejvíc práce na stránce, nic z ní není v první obrazovce na mobilu |
| `/historie` | 6,1 s, LCP 9,0 s | `react-dom` 1,1 s, `uu5g05` 0,8 s; časová osa je skrytá, dokud nejsou změřené všechny položky (`cf8a560`) | ne `Deferred` (osa je hlavní obsah); zvážit zvlášť, viz Q5 |
| `/zapas` | 2,4 s | init `uu_gdsg01-unicorn` 1,7 s, render 0,5 s | ne (render malý) |
| `/muzstvo` | 1,8 s | init uu5 1,8 s, render 0,8 s | ne |
| `/` | 3,0–4,0 s | init `uu_gdsg01-unicorn` 2,9 s, render 0,8 s | už má `Deferred` (M3) |

**`/sezona` konkrétně** (`routes/season.jsx`): `<Section variant="hatched">` s koly zabalit do
`UiElements.Deferred`. Pozor na skok na kolo z adresy (`?kolo=`): `useEffect` dnes čeká na
`roundList.length`, ale kotvy kol by po změně vznikly až po transition. Buď scroll spustit z odložené
části (efekt uvnitř `Deferred`), nebo při `kolo` v adrese vykreslit hned bez odkladu (jako
`BelowFold` v propertymanu při fragmentu v adrese).

- **Odhad 0,25–0,5 d** včetně A/B měření (3 běhy, medián, stejný stav stroje).
- **Přínos (`inferred` z propertymanu `/rezervace`: TBT 1,42 → 1,0 s, skóre 46 → 50):** TBT `/sezona`
  znatelně dolů (render kol se rozdělí do krátkých úloh transition), skóre mobilu spíš +3 až +8.
  LCP se nezmění (je to nadpis, 1,3 s).

### E. Galerie a fotky (bod 6)

- `/fotogalerie` je od 2026-11-19 přesměrovaná na úvod a routy `gallery.jsx`, `gallery-detail.jsx`
  nejsou v `router.jsx`. `uu5imagingg01` web dnes nestahuje vůbec (hlídá `lazy-libs.test.js`).
- Až se galerie vrátí: stejný postup jako propertyman P2 (dlaždice jako `<img>` se `srcset` hned,
  `Uu5Imaging.Image` jen pro lightbox, knihovna v `requestIdleCallback`). Dnes `gallery-detail.jsx`
  kreslí `Uu5Imaging.Image` přímo v dlaždici (`Suspense` se skeletonem 240 px), tj. stejný řetěz
  `uu5imagingg01` → `uu5g05-forms` před první fotkou, jaký měl propertyman.
- Týmové fotky (jediné fotky na webu) mají 600 px a `loading="lazy"`; `srcset` by na mobilu ušetřil
  málo (2,8 MB celkem, stahují se postupně při scrollu). Stačí C1.
- **Dnes 0 d**; až s galerií odhad 0,5–1 d (jako v propertymanu).

---

## 5. Pořadí kroků, odhad a přínos

| # | Krok | Kde | Odhad | Očekávaný přínos |
|---|---|---|---:|---|
| 1 | **A + B**: caio-ui 0.4.13 a caio-server 0.8.2, sdílený boot screen, smazat `core/boot-screen.jsx` | afkbratcice | 0,5 d | beze změny pro návštěvníka; jedna kopie boot screenu; rychlejší opakované návštěvy |
| 1b | **B2** caio-server 0.8.3 (vzor `assets/vendor/<název>/<verze>/`), písma AFK do `assets/vendor/<písmo>/<verze>/` | caio-server, afkbratcice | 0,25–0,35 d | React a písma bez revalidace při opakované návštěvě |
| 2 | **C1** týmové fotky s rozměry | afkbratcice | 0,25 d | CLS `/tymove-fotky` 0,13–0,16 → 0 |
| 3 | **C2 a)** `season/listCurrent` vrací trenéry mužstev (server logika, DB beze změny) | afkbratcice server + klient | 0,5 d | CLS `/muzstva` 0,031 → 0; o 4 dotazy méně |
| 4 | **D** `/sezona`: kola v `Deferred` (+ skok na kolo) | afkbratcice | 0,25–0,5 d | TBT `/sezona` dolů, mobil +3–8 (`inferred`) |
| 5 | Měření před/po (lokální produkční build, stejný stav stroje), vydání, měření produkce | — | 0,5 d | |
| | **Celkem** | | **≈ 2,25–2,6 d** | |
| (E) | Galerie podle propertymanu P2 | afkbratcice | 0,5–1 d | až s návratem galerie |

Kroky 1–4 jsou na sobě nezávislé. **Jedno vydání AFK na konci** (Caio 2026-11-26, Q2); caio-server
0.8.3 se vydá dřív, protože na něm AFK závisí. Cíl po krocích 1–4: **CLS 0 na všech routách**, TBT
`/sezona` nižší, ostatní Lighthouse beze změny. Víc bez zásahu do inicializace uu5 (M4) nepůjde,
stejně jako v propertymanu.

---

## 6. Ověření

- CLS: `cls.mjs` na všech routách z 3.1, 390/1366, slow 4G + CPU 4×, hlavní routy 3 běhy; `/`,
  `/tymove-fotky`, `/historie`, `/sezona` i se scrollem. Cíl: 0 všude (kromě cuknutí kruhu 0,0015).
- Lighthouse mobil 3× a desktop 3× na `/`, `/sezona`, `/zapas`, `/muzstvo`, admin, **na síti**
  a lokálně před/po na stejném stroji ve stejném stavu.
- Filmový pás startu webu i adminu: boot screen → hotová stránka s ikonami lišty; chyba startu
  (zablokovaný `season/listCurrent`) ukáže chybovou obrazovku hned, ne po 20 s.
- Hlavičky po vydání: `libs/<verze>/`, `chunks/*-<hash>.js` `immutable`, HTML a `index.js` `no-cache`
  / `max-age=0`.
- `npm test` (včetně `lazy-libs.test.js`, `team-photos.test.js`), ruční průchod: kotvy na home
  (`#program`), kolo z adresy na `/sezona?…&kolo=`, administrace po přihlášení.

---

## 7. Otázky na Caia

**Odpovědi (Caio 2026-11-26):**
1. C2 a): trenéři v úvodních datech, počítá je server, v DB se nic nemění.
2. Všechno jedním vydáním.
3. React i písma dlouhou cache, pokud mají cestu s verzí (krok B2).
4. Otevřené. Caio navrhuje zabudovat zpoždění přímo do komponent v caio-ui. Stav: caio-ui
   (0.4.12) žádný `Skeleton` ani `PageLoading` nemá. `Skeleton` je `Uu5Elements.Skeleton`
   z uu5g05-elements a AFK ho obaluje vlastní komponentou (`components/layout/skeleton.jsx`).
   `PageLoading` je čistě AFK. Propertyman zpoždění dává ručně na `Uu5Elements.Pending` na
   třech místech. Návrh: do `caio-ui-elements` přidat `Skeleton` a `Pending` se zabudovaným
   zpožděním (stejné props jako uu5), případně i `PageLoading`. Appky pak používají jen je
   a `delayed-appear.js` z obou zmizí. Odhad 0,5 d v caio-ui a AFK (jde s krokem 1, caio-ui se
   bumpuje tak jako tak), propertyman jako follow-up. Čeká na rozhodnutí.

   **`PageLoading` obecně (Caio se ptal 2026-11-26):** dnes je to v AFK ruční kopie boot screenu
   (kruh `min(252px, 70vw)`, maska, erb 60 %, `clubRed`), která se ukazuje se zpožděním na třech
   místech: fallback líné routy webu (`router.jsx`), fallback administrace (`admin/app.jsx`)
   a „Zkusit znovu“ po chybě startu (`app-context.jsx`). Při změně `boot` v `caio.config.js` se
   musí ručně upravit. Obecná verze by kopii nepotřebovala:
   - **caio-devkit:** CSS boot screenu (`bootCss`) dnes míří jen na `#app-loading`
     (`position: fixed`). Selektory `.mark`, `.ring`, `.logo` a barvy pro světlý a tmavý režim
     vázat i na třídu (např. `.app-loading-mark`), aby šly použít mimo celou obrazovku.
   - **caio-ui:** `UiApp.PageLoading` (`height`, `className`) si při startu (`renderApp`, který
     boot screen stejně drží) uschová kopii `.mark` (kruh a logo, u propertymanu inline SVG)
     a vykreslí ji se zpožděním, textem „Načítám…“ pro čtečku a minimální výškou. Logo, velikost,
     barvy a tmavý režim tak přijdou z `boot` konfigurace appky, nic se nekopíruje.
   - **AFK:** smazat `components/layout/page-loading.jsx`, tři místa přepnout na `UiApp.PageLoading`.
   - **Propertyman:** líné routy webu nemá, použil by ho ve fallbacku administrace (líné
     `settings-fields`) a případně po chybě startu. Přínos je tam hlavně stejný vzhled jako start.
   - Odhad 0,5 d (devkit + caio-ui + AFK), propertyman follow-up.
5. `/historie` nechat být.

Původní otázky:

1. **`/muzstva` (C2):** a) trenéři rovnou v úvodních datech (změna serveru, karty hotové od začátku,
   o 4 dotazy méně), nebo b) jen klient: mřížka neviditelná, dokud trenéři nedorazí?
   *Doporučuju a).*
2. **Vydání:** všechno jednou verzí na konci, nebo krok 1 (knihovny + sdílený boot screen) hned
   jako samostatnou verzi a zbytek potom?
3. **React v `assets/vendor/` a písma (B):** react-dom a react zůstanou po 0.8.2 `max-age=0` (v AFK
   i v propertymanu). Rozšířit caio-server o vzor `assets/vendor/<knihovna>/<verze>/` jako další krok
   stacku (0.8.3, bump v obou appkách), nebo počkat, až vlastní React zmizí s oficiální uu5?
4. **`delayed-appear`:** AFK a propertyman mají stejnou kopii (`components/layout/delayed-appear.js`,
   `tools/delayed-appear.js`). Přesunout do caio-ui, nebo nechat v appkách?
5. **`/historie`:** LCP mobil 9 s, protože časová osa je skrytá, dokud se nezměří všechny položky
   (`cf8a560`, kvůli CLS). Řešit zvlášť (např. ukázat první položky dřív), nebo nechat?

---

## 8. Implementace (2026-11-26, necommitnuto, nevydáno)

Caio 2026-11-26: Q4 do caio-ui (`Skeleton`, `Pending`, `PageLoading`), implementovat vše a ověřit,
že se web vizuálně nezměnil. Stack je v AFK nalinkovaný lokálně (`caio-devkit npm run link-local`),
`package.json` AFK ještě míří na publikované verze.

| Kde | Změna |
|---|---|
| caio-ui | `UiElements.Skeleton`, `UiElements.Pending`, `UiElements.DELAYED_APPEAR` (+ `APPEAR_DELAY_MS`, `APPEAR_FADE_MS`), `UiApp.PageLoading` (kruh s logem z boot screenu přes `UiApp.getBootMarkHtml()`), LSI `app.pageLoading`; README, release notes |
| caio-devkit | styl `.mark`/`.ring`/`.logo` boot screenu platí i uvnitř `.app-loading-inline` (světlý i tmavý režim, reduced motion); test |
| caio-server | immutable i pro `assets/vendor/<název>/<verze>/…`; testy, README, release notes |
| AFK A | `UiApp.renderApp(<App />, BOOT_OPTIONS)` (`tools/boot-options.js`), `UiApp.BootReady`, `UiApp.useBootScreenActive`; smazané `core/boot-screen.jsx` |
| AFK Q4 | `UiElements.Skeleton`, `UiApp.PageLoading`; smazané `layout/skeleton.jsx`, `page-loading.jsx`, `delayed-appear.js` |
| AFK B2 | písma v `assets/vendor/barlow/1.408.0/` a `assets/vendor/bebas-neue/2.0.0/` (verze z `name` tabulky souborů), `fonts.css`, design dokumenty |
| AFK C1 | `height` u každé týmové fotky (`team-photos.js`), `<img width="600" height>`; test rozměrů proti souborům |
| AFK C2 | `season/listCurrent` vrací `coachList` (jeden dotaz na funkce, jeden na osoby, z osoby jen jméno), `ManagementDao.listByFilter({ teamIdList })`; `/muzstva` bez `management/list`; test |
| AFK D | `/sezona`: kola v `UiElements.Deferred` (`RoundList`), skok na `kolo` z adresy uvnitř odložené části |

**Ověření** (lokální produkční build proti lokální DB, `afk-adopt-pm/visual/` ve sdílených notách):

- Testy: AFK 244/244, caio-ui, caio-devkit `document.test.js` 31/31, caio-server `static-cache` 29/29.
- **Vizuální srovnání** před/po (Edge headless, celé stránky, 15 rout × mobil tmavý, mobil světlý,
  desktop tmavý, plus boot screen, `PageLoading` a skeleton se zadrženými požadavky): **pixelově
  shodné**, včetně `PageLoading` a skeletonu. Rozdíly jen tam, kde se liší i dva běhy téhož buildu:
  mapa na `/kontakt` (dlaždice), pořadí hráčů se stejným počtem zápasů na `/muzstvo/statistiky`,
  natočení kruhu boot screenu. `/muzstva`: baseline náhodou bez řádku trenéra (dotaz
  `management/list` selhal, karta spadla do prázdného seznamu), po změně je trenér vidět jako
  v prvním běhu baseline a je stabilní mezi běhy. Světlý režim `PageLoading`: boot screen i stará
  kopie mají tutéž červenou `#D01319`.
- **CLS** (slow 4G + CPU 4×, 2 běhy): `/tymove-fotky`, `/muzstva`, `/sezona`, `/`, `/kontakt` **0**
  na mobilu i desktopu; `/vybor` 0,004 (beze změny, C3 se nedělá).
- **Cache**: `assets/vendor/barlow/1.408.0/…` a `assets/vendor/react-dom/19.1.9/…` mají
  `immutable`; `index.js`, `libs/_shim/…`, `assets/teams/…` dál `max-age=0`.
- **Chyba startu** (`season/listCurrent` selže): boot screen se na webu i v adminu pustí za ~1,6 s
  a ukáže chybovou obrazovku, ne až pojistkou 20 s.
- `/sezona?…&kolo=3`: odroluje na kolo 3 i s odloženými koly.
- Neměřeno: Lighthouse/TBT `/sezona` před a po (build před změnami už v `public/` není; chce to
  stejný stav stroje). Lokální CLS před změnami taky ne, srovnání je proti produkci 0.12.5.

**Doplněk (2026-11-26, po commitu):**

- `PageLoading` v AFK pixelově ověřen proti starému buildu (předchozí commit v dočasném worktree,
  animace zmrazené): boot screen, `PageLoading` i skeleton 0 px rozdílu. První srovnání to
  nepokrylo, baseline vyfotila `PageLoading` dřív, než se objevil.
- **Propertyman** (`caio_propertyman` a31af53): `UiElements.Pending` místo uu5 `Pending` +
  vlastního `DELAYED_APPEAR`, detail rezervace v adminu přes `UiApp.PageLoading`, písma
  v `assets/vendor/fraunces/1.0.0/` a `assets/vendor/karla/2.4.0/`. Web pixelově beze změny
  (12 rout × 3 pohledy), testy 351/351. `PageLoading` tam nejdřív ukázal uu5 „Blokovaný obsah“:
  uu5g05 blokuje `dangerouslySetInnerHTML` s logem jako maskou (`style` s `url()`). Opraveno
  v caio-ui (bb60739): `getBootMark()` vrací kopii DOM uzlu, `PageLoading` ji vloží
  v `useLayoutEffect`. Ve světlém i tmavém režimu (zelený kruh, podložka pod logem) sedí s boot
  screenem adminu.

**Zbývá k vydání** (na pokyn): vydat caio-devkit 0.5.4, caio-server 0.8.3 a caio-ui 0.4.14; v AFK
zvednout `caio-devkit`, `caio-server` a `caio-ui` na nové verze, `npm install`, `npm test`, vydání
AFK a kontrola hlaviček na produkci. Propertyman zvlášť: přechod na `UiElements.Skeleton`/`Pending`,
`UiApp.PageLoading` a písma do `assets/vendor/`.

---

## Příloha: data a skripty

Mimo repo: `…\side-session-notes\local_ffeaff88-25cc-4fd3-a175-b8b4313ff9bf\afk-adopt-pm\`

- `cls.mjs`, `run.mjs`, `lh.sh`: kopie z `loading-performance-pm/` (propertyman). V Git Bash spouštět
  s `MSYS_NO_PATHCONV=1`. `measure.sh`: celá dávka výchozího stavu.
- `prod-a.txt` (hlavní routy, 3 běhy), `prod-b.txt` (ostatní, 1 běh), `prod-scroll*.txt` (se scrollem),
  `lh-prod.txt` (Lighthouse), `lh-calib.txt` (kalibrace na propertymanu); `out-prod*/`: JSON každého
  běhu CLS (posuny se zdrojovými uzly, vodopád, vzorky výšky); `lh/`: Lighthouse reporty.
