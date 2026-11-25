# Návrh: rychlejší web na mobilu (Lighthouse)

Stav: návrh, 2026-11-25. Měřeno na produkci `https://afkbratcice.cz/` verze 0.12.3, první návštěva
(prázdná cache), Lighthouse 12 v headless Edge. Caiovy PDF reporty jsem nepřečetl (zprávy jsou bez
textové vrstvy), čísla níže jsou z vlastních běhů.

## 1. Výsledky

| Profil | Výkon | FCP | LCP | TBT | CLS | SI |
|---|---:|---:|---:|---:|---:|---:|
| Mobil, simulované zpomalení (výchozí Lighthouse, 3 běhy) | 54–59 | 0,9–1,0 s | 6,0–6,6 s | 640–860 ms | 0 | 4,5–4,7 s |
| Mobil, skutečné zpomalení CPU 4× a sítě (2 běhy) | 45 | 1,1 s | 13,0 s | 5,7 s | 0 | 1,2 s |
| Desktop (1 běh) | 88 | 0,5 s | 1,5 s | 110 ms | 0 | 2,7 s |

Ostatní kategorie na mobilu: přístupnost 92, best practices 96, SEO 100.

- **LCP** je nadpis „AFK BRATČICE“ v hero (h1 96 px). 87 % LCP je *render delay*: nadpis nečeká na obrázek ani
  na písmo, ale na to, až doběhne JavaScript a Reactem se vykreslí celá stránka.
- **CLS 0 a FCP pod 1 s** drží boot screen a dosavadní opravy; tady není co zlepšovat.
- Body ztrácíme skoro jen na **LCP (25 % skóre) a TBT (30 %)**. Obojí má stejnou příčinu: hlavní vlákno.

## 2. Kam jde čas

### 2.1 Řetěz požadavků (síť)

Každý krok začne, až doběhne předchozí (neomezená síť, časy začátku):

| Krok | Začátek | Co |
|---|---:|---|
| 1 | 0,23 s | HTML (3 kB) |
| 2 | 0,38 s | `uu5loaderg01` (z HTML) |
| 3 | 0,66 s | `index.js` (až po loaderu) |
| 4 | 0,79 s | `uu5g05`, `uu5g05-elements`, `react`, chunky aplikace (z `index.js`) |
| 5 | 1,17 s | `react-dom` (až po shimu `react-dom/client`) |
| 6 | 1,40 s | `uu_gdsg01-unicorn`, `uu_i18ng01`, `uu_appdatatypesg02`, `uu5stringg01` (závislosti uu5) |
| 7 | 1,67 s | `uu_gdsg01-unicorn/…/font.min.css` |
| 8 | 1,80 s | 8 písem, CSS ikon a **úvodní dotazy** (`season/listCurrent`, `team/list`, `category/list`, `auth`, `sys/settings/get`) |
| 9 | 2,23 s | data home (`match/list`, 4× `match/getLast`, `stats/getTable`) |
| 10 | 2,44 s | 16 log týmů ze `storage.googleapis.com` |

Simulovaný mobil počítá s latencí ~560 ms na požadavek, takže 9 kroků za sebou dělá ~4–5 s, i když
dat je málo (celkem 1,2 MB, z toho JS ~700 kB). Písma i úvodní dotazy přitom nezávisí na ničem
z kroků 3–7: jejich adresy jsou známé už v HTML.

### 2.2 Hlavní vlákno (JavaScript)

Skutečné zpomalení CPU 4×, celkem 8,4 s práce na hlavním vlákně:

| Skript | Čas | Poznámka |
|---|---:|---|
| `react-dom` | 3,4 s | vykreslení stránky; jeden blok 2,4 s = první render celé home najednou |
| `uu_gdsg01-unicorn` | 2,0 s | jeden blok 2,0 s při startu; táhne ho `uu5g05-elements` (GDS téma) |
| ostatní (HTML, nepřiřazené, uu5g05, elements) | ~2,6 s | z toho styly a layout 1,6 s (CSS-in-JS) |

Nevyužitý JS při startu: `uu5g05-elements` 68 %, `uu5g05` 60 %, `uu_appdatatypesg02` 88 % (celkem ~250 kB).
To jsou platformní knihovny, ze kterých appka bere jen část; rozdělit je nemůžeme.

### 2.3 Obrázky

- **Loga týmů:** 16 souborů po 8–35 kB (celkem ~300 kB), originály 400×400 px. Zobrazují se v tabulce
  a dlaždicích zápasů v 24–40 px. Lighthouse odhaduje úsporu 281 kB.
- Mají `Cache-Control: max-age=3600`: opakovaná návštěva po hodině je stahuje znovu, i když se soubor
  s UUID jménem nikdy nemění.
- Erb na boot screenu a v hero `icon-192-transparent.png` je PNG 41 kB (WebP by byl ~5 kB). Je to
  první obrázek stránky.
- Lighthouse hlásí obrázky bez `width`/`height` (CLS je přesto 0, místo drží CSS).

### 2.4 Přístupnost (92)

Jediná chyba: **odkaz s logem v liště nemá přístupný název** (`link-name`; `a` v `UiApp.Top` z caio-ui).

## 3. Návrh (seřazeno podle přínosu pro mobil)

### M1. Přednačíst, co je známé už v HTML (síť, LCP)

- ~~Preload písem v `client/index.html`~~ **vyřazeno (2026-11-25):** písma se stahují od startu JS
  (boot-screen `preloadFonts`) souběžně s úvodními dotazy a jsou hotová zároveň s daty; h1 má
  `font-display: swap`, takže LCP na ně nečeká. Preload 8 souborů (135 kB, priorita High) by na
  pomalé síti předběhl skripty (uu5loader je stahuje s prioritou Low) a LCP spíš zhoršil.
- `<link rel="preload" as="script">` pro knihovny startu (`uu5g05`, `uu5g05-elements`, `react`, `react-dom`,
  `uu_gdsg01-unicorn`, `uu_i18ng01`, `uu_appdatatypesg02`, `uu5stringg01`, `index.js`). Adresy mají verze
  z import mapy, kterou generuje devkit, takže **čistě to patří do caio-devkit** (`document.js`: preload
  podle import mapy a statických importů vstupu). Kroky 3–7 by se zploštily do jednoho.
- **Odhad:** simulovaný mobil LCP −1,5 až −2,5 s. Na TBT to nemá vliv.
- Riziko: přednačtení soutěží o pásmo; proto jen startovní knihovny, ne celá import mapa (52 položek).

### M2. Úvodní data souběžně s JavaScriptem (síť, LCP)

`season/listCurrent`, `team/list`, `category/list`, `sys/settings/get` a `auth` začínají až v kroku 8.

- **Varianta a, doporučuju:** server vloží úvodní data do HTML (`<script type="application/json" id="boot-data">`)
  a `AppProvider` si je vezme místo prvních dotazů. Ušetří celý krok 8 (na mobilu ~0,6–1 s).
  Změna caio-serveru (servírování `index.html`) a `core/app-context.jsx`.
- Varianta b: `<link rel="preload" as="fetch" crossorigin>`. Prohlížeč odpověď použije jen při stejném
  režimu, credentials i hlavičkách jako pozdější `fetch`, takže je to křehké.
- Druhá vlna (`match/list`, `getLast` ×4, `stats/getTable`) čeká na `team/list`. Jeden dotaz
  `home/get` by ji spojil, ale data jsou pod ohybem a LCP neblokují; má to až nízkou prioritu.

### M3. Vykreslit nejdřív jen první obrazovku (hlavní vlákno, LCP + TBT)

První render home je jeden blok 2,4 s (CPU 4×): hero, program, výsledky, tabulka, aktuality a patička
najednou. Nad ohybem je na mobilu jen hero.

- Sekce pod ohybem mountnout až po prvním vykreslení: `SectionSlot lazy` z fáze 2 B
  (proposal-section-loading.md) s rezervou výšky, nebo jednodušeji `startTransition` / `requestIdleCallback`.
  Místo pro sekce je už rezervované (A1), takže CLS zůstane 0.
- **Odhad:** LCP −1 až −2 s při skutečném zpomalení, TBT −30 až −50 %. Přímo zlepšuje i reálné telefony,
  na rozdíl od M1/M2, které pomáhají hlavně při pomalé síti.
- Boot screen se pak pustí po hero, ne po celé stránce. Pustit ho až po všem by zisk snědlo.

### M4. Proč `uu_gdsg01-unicorn` počítá 2 s (hlavní vlákno, TBT)

- Jeden blok 2,0 s (CPU 4×, tj. ~0,5 s na rychlém počítači) při startu. Knihovnu táhne `uu5g05-elements`,
  appka ji přímo nepoužívá (vlastní téma, vlastní písma). Načítá navíc `font.min.css` z Unicorn tématu.
- **Nejdřív profil** (CPU profile startu, které funkce). Podle výsledku:
  - jde o generování stylů tématu → zjistit u uu5, jestli se dá vypnout nebo odložit;
  - jde o obecnou inicializaci → issue do SLS uu5 s profilem.
- Bez profilu neslibuju nic. Je to ale druhý největší kus TBT.

### M5. Loga týmů v malých rozměrech + dlouhá cache (síť)

- Při uploadu loga uložit i náhled 96×96 WebP (~2–3 kB) a v tabulce i dlaždicích používat ten. Úspora
  ~250 kB na home, víc na stránkách tabulek a zápasů. Pro existující loga jednorázový skript.
- Objekty v bucketu `afkbratcice-binary` nahrávat s `Cache-Control: public, max-age=31536000, immutable`
  (jména jsou UUID), existující přenastavit `gsutil setmeta`.
- `width`/`height` na `<img>` loga (`team-logo`), `loading="lazy"` pro loga pod ohybem.
- Erb `icon-192-transparent.png` 41 kB → WebP/AVIF (nebo SVG, pokud existuje vektor). Pozor, je
  i v manifestu a boot screenu z devkitu.
- **Odhad:** menší vliv na skóre (obrázky neblokují LCP), ale ~300 kB méně dat na mobilních datech.

### M6. Drobnosti

- `aria-label` pro odkaz s logem v `UiApp.Top` (caio-ui) → přístupnost 100.
- Písma: zvážit, jestli je potřeba Barlow 600 i 700 (každá řez ×2 subsety = ~37 kB).
- Source mapy uu5 knihoven (best practices 96): neřešit.

## 4. Pořadí a odhad

| Krok | Kde | Práce | Očekávaný přínos (mobil) |
|---|---|---:|---|
| M1 písma | afkbratcice `client/index.html` | 0,5 h | písma o ~1,4 s dřív, boot screen se pustí dřív |
| M3 první obrazovka | afkbratcice (home), případně caio-ui `SectionSlot` | 0,5–1,5 d | LCP −1 až −2 s, TBT −30–50 % |
| M5 loga a cache | afkbratcice server + skript + bucket | 1 d | −250 kB, rychlejší opakované návštěvy |
| M1 knihovny | caio-devkit | 0,5–1 d | LCP −1,5 až −2,5 s (simulace) |
| M2 data v HTML | caio-server + afkbratcice | 1 d | LCP −0,6 až −1 s |
| M4 profil unicorn | analýza, pak uu5/SLS | 0,5 d analýza | TBT až −2 s, nejisté |
| M6 aria-label | caio-ui | 0,5 h | přístupnost 100 |

Realistický cíl po M1 + M3 + M5 (jen afkbratcice, bez sdílených repozitářů): výkon na mobilu
~70–75. S M1 knihovnami a M2 (devkit, server) ~80+. Přes 90 to s uu5 runtime (~700 kB JS, 2 s
inicializace na zpomaleném CPU) nejspíš nepůjde bez M4.

## 5. Ověření

- Stejné měření po každém kroku: 3× Lighthouse mobil (simulované) + 1× skutečné zpomalení, medián.
- Filmový pás startu (section-loading/film.mjs), CLS zůstane 0.
- Skript měření: `lighthouse https://afkbratcice.cz/ --chrome-flags=--headless=new` s `CHROME_PATH` na Edge.

## 6. Výsledek M1 + M3 + M6 (lokálně, 2026-11-25)

Implementováno: preload startovních skriptů v caio-devkit (`src/vite/preload.js`, `fetchpriority="low"`),
`UiElements.Deferred` v caio-ui (home: hero + statistiky hned, zbytek v transition),
`top.logo.label` v caio-ui (`elementAttrs` s `aria-label`, afk: „AFK Bratčice“). Měřeno na
lokálním produkčním buildu (8082), medián ze 3 běhů:

| Profil | Před | Po |
|---|---|---|
| Jen CPU 4× (bez omezení sítě): LCP | 5,2 s | 4,3 s |
| Jen CPU 4×: TBT | 4,8 s | 4,0 s |
| Přístupnost | 92 | 95 (`link-name` prošel) |
| Simulovaný mobil: FCP | 1,0 s | 1,0 s |
| Simulovaný mobil: LCP | 14,6 s | 14,5 s |

- Síťový přínos M1 se lokálně změřit nedá: dev server neposílá gzip, takže simulace je omezená
  pásmem (1,3 MB nekomprimovaných skriptů). Ve vodopádu je ale vidět, že všechny startovní skripty
  začínají hned po HTML místo v šesti kolech. Ověřit až na produkci.
- Preload s výchozí (vysokou) prioritou zhoršil simulované FCP z 1 s na 9 s (Lighthouse ho počítá
  do prvního vykreslení), proto `fetchpriority="low"`.
- M3 zkrátil první render, ale TBT zůstává vysoké: commit odložených sekcí je jeden blok a hlavní
  dlouhé úlohy jsou inicializace uu5 (`uu_gdsg01-unicorn` ~1,6 s při CPU 4×) a render — viz M4.

## 7. Produkce 0.12.4 a vypnutí M1 (2026-11-25)

Lighthouse proti afkbratcice.cz, 0.12.3 → 0.12.4 (M1 + M3 + M6):

| Profil | 0.12.3 | 0.12.4 |
|---|---|---|
| Simulovaný mobil: výkon (3 běhy) | 54 / 59 / 58 | 52 / 60 / 62 |
| Simulovaný mobil: LCP | 6,0–6,6 s | 5,8–6,0 s |
| Mobil, skutečné zpomalení: LCP | 13,0 s | 11,3 s |
| Přístupnost | 92 | 95 (desktop 100) |
| Desktop: výkon | 88 | 73 / 74 / 76 |
| Desktop: TBT | 110 ms | 330–400 ms |

Pokles desktopu dělá M1: lokálně stejný build s preloady TBT 160–190 ms (výkon 78–81), bez nich
90 ms (83). Skripty dorazí najednou a uu5loader je spustí v jednom dlouhém bloku, dřív je
rozdělovaly mezery mezi stahováním. Mobilu M1 dal jen ~−0,5 s LCP. **M1 je proto od caio-devkit
0.5.3 vypnuté** (volba pluginu `preloadScripts`, výchozí `false`); M3 a M6 zůstávají.
