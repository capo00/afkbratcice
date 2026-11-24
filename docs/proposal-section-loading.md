# Návrh: načítání sekcí bez poskakování layoutu

Stav: **návrh k odsouhlasení, verze 2** (2026-11-23, po revizi architekta a designera, viz [kap. 10](#10-revize-co-se-změnilo-proti-verzi-1)).
Nic z něj není implementované. Platí pro `afkbratcice` i `caio_propertyman` (web Roubený ráj).
**Fáze 1 se obejde bez změny `caio-ui` a `caio-devkit`.** Sdílené části přicházejí na řadu až ve fázi 2,
a to jen pokud je nové měření po fázi 1 ukáže jako potřebné.

Naměřená data, měřicí skript a screenshoty leží mimo repo, ve sdílené složce session
(`…\side-session-notes\local_ffeaff88-25cc-4fd3-a175-b8b4313ff9bf\section-loading\`, viz [Příloha](#příloha-měření-a-skript)).

---

## 1. Shrnutí

- **Skáče hlavně patička, a to ve dvou chvílích.** Poprvé když se připojí routa, podruhé (a víc) když
  dorazí data sekcí. `caio-ui Page` má `min-height: 100vh` a flex, takže patička je při každém krátkém
  mezistavu (fallback 320 px, skeleton 200 px) **ve viewportu**. Na `/zapas` (mobil) jsou to tři posuny
  patičky: 0,058 při mountu routy, 0,086 po `match/get`, **0,595 po `match/list`**.
- **Když je patička pod ohybem, většina CLS zmizí.** Test se skrytou patičkou: `/muzstvo`, `/zapas`, `/zajimavosti`
  spadnou na 0. Nahrazení skeletonu obsahem samo o sobě CLS nedělá, pokud pod ním ve viewportu nic není.
- **Zbývají dvě cílené příčiny:** trenéři doplnění do hotových karet `/muzstva` (0,165) a časová osa
  `/historie` (0,30), kde se dotahují lazy chunky `uu5extrasg01` a písmo ikon. Obsah historie je přitom statický.
- **Propertyman je při prvním načtení v pořádku** (CLS ≈ 0). Na `/cenik` se posouvá kalendář o ~50 px
  a ceník při znovunačtení s daty spadne na spinner 200 px. Ve scrollu po home driftují ruční odhady `ESTIMATE`.
- **Fáze 1 (≈ 2 d, jen v aplikacích):** rezerva výšky obalu routy, aby patička byla vždy pod ohybem;
  malé routy bez lazy načítání; rezerva řádku trenéra; oprava historie; tři drobné opravy v propertymanu;
  nové měření (≥ 3 běhy, CWV metrika). **Fáze 2 (≈ 5–7 d)** jen podle výsledků měření:
  sdílená `SectionSlot` a primitiva skeletonu v caio-ui, písma v devkitu, souvislý boot screen, stavy dlouhého
  čekání a offline.

---

## 2. Jak jsem měřil

- Skript přes Chrome DevTools Protocol v **Edge headless**: `Network.emulateNetworkConditions`
  + `Emulation.setCPUThrottlingRate`, vypnutá cache (první návštěva), `PerformanceObserver('layout-shift')`
  s popisem zdrojových uzlů a rect před/po, k tomu vzorkování výšky dokumentu a pozice patičky po 100 ms.
- Profil **„slow 4G“**: 1,6 Mbit/s dolů, 150 ms RTT, CPU 4× pomalejší. Viewporty **390×844** (mobil)
  a **1366×768** (desktop). Měřeno proti **produkci** (`https://afkbratcice.cz`, `https://roubenyraj.cz`), jen čtení.
- **Absolutní časy jsou nafouknuté** (CPU throttling zpomaluje i parsování uu5 knihoven). Použitelné je pořadí
  událostí a CLS.
- **Dvě čísla CLS.** Skript sčítá všechny posuny („součet“). Core Web Vitals (CWV) počítají maximum
  z oken (mezera ≤ 1 s, okno ≤ 5 s) a prahy 0,1 / 0,25 platí pro ně. V tabulkách jsou obě, cíle se vztahují k CWV.
- **Omezení:**
  1. Home na mobilu hlásí CLS 0, i když patička skočí z 376 na 2777 px. Nevysvětleno, pro home proto
     sleduju pozici patičky, ne jen CLS.
  2. Jeden běh na konfiguraci (home desktop opakovaně 0,3846). Pro „po“ je potřeba ≥ 3 běhy (kap. 7).
  3. LCP na většině rout je logo boot screenu (≈ 1,1–1,5 s), jako metrika „před/po“ je k ničemu.
  4. Jedna kopie dat, jeden profil sítě.

---

## 3. Stav před změnou

### 3.1 afkbratcice (první návštěva, slow 4G)

| Routa | Mobil CLS (CWV / součet) | Desktop CLS (CWV / součet) | Co se hýbe |
|---|---:|---:|---|
| `/` (home) | 0 / 0 (viz omezení 1) | **0,385** / 0,385 | patička 482 → 2498 px v jednom snímku |
| `/muzstva` | **0,568** / 0,568 | 0,108 / 0,108 | patička (0,40), pak karty: trenéři dorazí později, karta 171 → 267 px |
| `/muzstvo?id=…` | **0,288** / 0,436 | 0,172 / 0,212 | patička 376 → 601 (skeleton) → 3499 px; 0,148 při mountu, 0,288 po datech |
| `/zapas?id=…` | **0,595** / 0,738 | **0,327** / 0,327 | patička: 0,058 mount, 0,086 po `match/get`, 0,595 po `match/list` (dotazy jdou sériově) |
| `/zajimavosti` | **0,365** / 0,471 | **0,302** / 0,318 | patička: 0,105 při mountu, 0,365 po renderu statistik |
| `/historie` | **0,463** / 1,133 | **0,389** / 0,432 | patička + časová osa (lazy chunky `uu5extrasg01`, ikony GDS) |
| `/kontakt` | 0,212 / 0,212 | 0,030 / 0,030 | patička 376 → 698 px |

Z 14 měření je **11 nad 0,1** (CWV).

**Test se skrytou patičkou** (`footer{display:none}` po celou dobu, mobil; měřeno pro pět rout):

| Routa | CWV s patičkou | CWV bez patičky |
|---|---:|---:|
| `/muzstvo` | 0,288 | **0** |
| `/zapas` | 0,595 | **0** |
| `/zajimavosti` | 0,365 | **0** |
| `/muzstva` | 0,568 | 0,165 (trenéři v kartách) |
| `/historie` | 0,463 | 0,296 (časová osa) |

U `/kontakt` a home desktop jediný posun způsobila patička, takže se dá čekat 0 i tam (`inferred`, neměřeno).

Pozor na výklad: test skryl patičku natrvalo, tedy i ve fázi dat. Odpovídá tomu opatření, které drží patičku
pod ohybem po celou dobu prvního vykreslení (A1), ne opatření, které ji skryje jen během fallbacku `Suspense`
(původní verze 1, viz kap. 10).

### 3.2 Průběh načítání home (mobil, slow 4G)

```
  0,4 s   boot screen z devkitu (#app-loading)
  ~7–15 s knihovny uu5, React, index.js; AppProvider spustí 4 dotazy (season/team/category/settings)
  ~15 s   hotovo → Top + PageLoading (spinner min. 320 px) + PATIČKA u spodku okna
  ~19 s   chunk routy home (3 kB)
  ~20 s   dalších 11 drobných chunků (po 0–3 kB, stahují se souběžně)
  ~21 s   data sekcí (match/list, 4× match/getLast, stats/getTable)
  ~22 s   loga týmů (webp), sekce naroste 3312 → 4100 px
```

Datové sekce home leží pod ohybem (hero + statistiky zaberou první obrazovku), takže jejich nárůst
(+435 px desktop / +788 px mobil) CLS nedělá. Dělá ho jen patička.

### 3.3 propertyman (Roubený ráj)

| Routa | Mobil CLS | Desktop CLS | Poznámka |
|---|---:|---:|---|
| `/` | 0 | 0 | bez lazy rout, vše se vykreslí najednou |
| `/cenik` | 0,025 | 0,007 | posouvá se `section#kalendar` (~50 px): rezerva kalendáře 260 px neodpovídá výsledku |
| `/galerie` | 0 | 0 | |
| `/rezervace` | 0,0005 | 0 | |
| **Scroll po `/`** (lazy sekce) | **0,014** | 0 | výška dokumentu 9243 → 8814 → 9229 → 8982 px; `ESTIMATE` v `home.jsx` jsou vedle až o ~430 px, `#recenze` odhad nemá |

LCP propertymanu (18–29 s v tomhle profilu) je jiné téma než tenhle návrh.

---

## 4. Příčiny

| # | Příčina | Kde | Dopad |
|---|---|---|---|
| C1 | Patička je ve viewportu, dokud obsah routy nedosáhne výšky okna: během fallbacku `Suspense` **i během skeletonů** (`Page` `min-height:100vh` + `flex:1 0 auto` na `main`) | afkbratcice: `router.jsx`, `components/layout/page-loading.jsx`, `components/data-state.jsx`; `caio-ui/src/caio-ui-app/page.jsx:77` | většina CLS na všech routách |
| C2 | Trenéři se do hotové karty mužstva doplní později, karta naroste | `routes/teams.jsx:92-98` | 0,165 (mobil) |
| C3 | Časová osa historie: `Uu5Extras.VerticalTimeline` dotahuje vlastní lazy chunky a pak CSS a písmo ikon GDS. Obsah je statický (`content/history.js`). Posun 0,46 v 26,97 s (dokument 4205 → 6459 px) zatím nevysvětlen | `components/history/history-timeline.jsx:55` | 0,30 |
| C4 | Vodopád: route chunk až po mountu appky, pak ~11 drobných sdílených chunků; na zápase `match/get` → `match/list` sériově | `router.jsx`, `routes/match.jsx:34,75` | prodlužuje dobu, kdy je stránka v mezistavu |
| C5 | Start prochází nesouvisejícími vizuály: boot screen (kruh + logo) → `PageLoading` bez rámu (`AppProvider`) → rám se spinnerem → obsah | `caio-devkit …/plugins/document.js`, `core/app-context.jsx:97-98` | záblesky, samy CLS nedělají |
| C6 | Ruční odhady výšek lazy sekcí zastarávají, `#recenze` odhad nemá | propertyman `routes/home.jsx` | drift ±430 px ve scrollu |
| C7 | Propertyman má rezervy, ale špatně velké (kalendář 260 px) a ceník při `pending` s daty ukáže spinner místo dat | `availability-calendar.jsx:70-71`, `pricing/pricing.jsx:75` | 0,025 na `/cenik` |
| C8 | Písma afkbratcice se načítají až při prvním použití; fallback na Androidu je Roboto (širší než Bebas) | `client.config.js:20`, `fonts.css` | v měření 0,0001–0,0003; hlavní problém to není |

Co nepůsobí: obrázky (loga mají pevný rámeček `TeamLogo`, fotka týmu `aspect-ratio`, hero logo rozměry).

---

## 5. Návrh řešení

### Principy

1. **Do viewportu nic, co se za chvíli posune.** Nejlevněji tím, že to, co se posouvá (patička), začíná pod ohybem.
2. **Nejdřív to, co podle měření dělá CLS, pak teprve obecná infrastruktura.**
3. **Stavy dat zůstávají v aplikaci** (`DataState`: chyby, LSI, retry). Sdílené prvky v caio-ui řeší jen místo a vzhled.

### Fáze 1: cílené opravy v aplikacích

#### A1. Patička vždy pod ohybem (afkbratcice, bez změny caio-ui)

- Obal routy v `router.jsx` (uvnitř `Suspense`, kolem fallbacku i obsahu) dostane trvale
  `min-block-size: calc(100vh − výška lišty)`. Patička tak při prvním vykreslení každé routy začíná pod ohybem
  a neposouvá se ani při mountu, ani po datech.
- `100vh`, ne `100svh`: na mobilu je `vh` „velký“ viewport, patička je bezpečně pod hranou i s lištou prohlížeče.
- `PageLoading` jako fallback vyplní tutéž výšku (dnes 320 px).
- **Cena:** krátké stránky mají nad patičkou volné místo. `/kontakt` na mobilu asi 150 px, patička se ukáže
  až po scrollu. Viz otevřená otázka 1.
- **Záložní varianta A2** (když mezera nebude přijatelná): patička skrytá, dokud běží fallback **nebo** první
  načtení kteréhokoli `DataState` routy. Čítač v kontextu aplikace (`DataState` se registruje v `useLayoutEffect`),
  pojistný timeout, `Footer` čte kontext. Patička je komponenta aplikace (`app.jsx:116`), caio-ui se nemění.
  Složitější a křehčí než A1, proto až druhá volba.

#### A3. Malé routy bez lazy načítání (afkbratcice)

- Route chunky jsou dohromady asi 50 kB přenosu (home 3 kB, team 2, teams 2, match 2, kontakt 1, Zajímavosti 6,
  11 sdílených po 0–3 kB). uu5 knihovny mají stovky kB.
- Importovat staticky všechny routy kromě `page.jsx` (táhne `uu5extrasg01` přes historii) a těch,
  které táhnou těžké knihovny (hlídá `lazy-libs.test.js`). Tak to dělá propertyman.
- Odpadne fáze `Suspense` u většiny rout, druhá vlna drobných chunků i rozdrobení. Hero home (statický) se
  vykreslí rovnou s rámem.
- Ověřit: velikost vstupního chunku před/po, první vykreslení home.

#### A4. Rezerva trenérů v kartě mužstva (afkbratcice)

- Dokud trenéři nejsou načtení, `InfoGroup` v kartě (`routes/teams.jsx:92-98`) drží místo pro řádek trenéra
  (stejný řádek s 50% čárou skeletonu, ne prázdný box). Počet řádků: pokud seznam mužstev nese počet trenérů,
  podle něj, jinak 1.

#### A5. Historie (afkbratcice)

- Nejdřív najít zdroj posunu v 26,97 s (filmový pás `FILM=` a zdrojové uzly posunu).
- Pak podle příčiny: přednačíst chunky `VerticalTimeline` a ikony, nebo rezervovat výšku osy (obsah je statický,
  výška je deterministická podle šířky), případně osu nahradit prostým CSS. Skeleton tu není správné řešení.

#### A6. Propertyman: tři drobné opravy

- `pricing.jsx:75`: při `pending` s daty nechat data viditelná (`aria-busy`), nespadnout na spinner.
- Kalendář dostupnosti: rezervu nahradit skutečným `Uu5Elements.Calendar` s prázdnou `dateMap` a malým
  `Pending` v legendě (tvar je pak přesný). Tím zmizí posun `#kalendar` na `/cenik`.
- `ESTIMATE` v `home.jsx` přeměřit a doplnit `#recenze`.

#### A7. Měření před/po

- `cls.mjs` rozšířit o CWV metriku (okna) vedle součtu, ≥ 3 běhy na konfiguraci (medián a maximum),
  sledování „patička ve viewportu před obsahem“ a značku `performance.mark("route-content-ready")`, kterou
  aplikace vloží, když routa vykreslí obsah (náhrada nepoužitelného LCP).
- Filmový pás (`FILM=`) světlý/tmavý režim, 360 a 1280 px.

### Fáze 2: jen podle výsledků měření po fázi 1

Pořadí podle očekávaného přínosu. Každý bod se zvlášť schvaluje.

#### B. `UiElements.SectionSlot` v caio-ui (minimální API)

Zobecnění `LazySection` z propertymanu, až bude mít druhého skutečného konzumenta.

```jsx
<UiElements.SectionSlot
  id="program"                            // kotva; placeholder ji drží
  estimate={{ xs: 560, s: 380, m: 320 }}  // px podle uu5 screenSize, chybějící = nejbližší menší
  lazy                                    // mount až 1000 px před viewportem (default false)
  reserve={pending}                       // drží min-výšku, dokud je true
>
  <ProgramContent />
</UiElements.SectionSlot>
```

- Žádné `state`, `skeleton` ani chybové UI. To zůstává v `DataState` aplikace.
- `revealAll` napojit automaticky na `scrollToAnchor` z caio-ui (hero na home má `href="#program"`).
- Prázdný a chybový stav uvnitř rezervy: jeden panel (`card` pozadí, `border`, radius 8 px, obsah svisle
  uprostřed). Je-li sekce při vyřešení pod viewportem, rezerva se hned uvolní.
- Učená výška v `localStorage` **vyřazena**: v měřeném scénáři (první návštěva) nepomůže; klíč by musel nést
  jazyk, verzi buildu, přihlášení a šířku; obsah závisí na datech; koliduje s obnovou scrollu v uu5g05.
  Případně později přes `sessionStorage` s verzí v klíči.
- Vydání caio-ui jako aditivní (0.4.x), opt-in, `caio-apps` beze změny.

#### C. Skeletony (vizuální specifikace)

Zatím pro afkbratcice podle měření CLS nepřinesou (obsah pod ohybem). Mají smysl pro vnímanou rychlost
a pro sekce nad ohybem. Až se budou dělat, pak takhle:

- **Skeleton je skutečný kontejner s kusy uvnitř:** stejná `Card` se stejnými props (`topStripe`,
  `footerSeparator`, `SpacingProvider`), stejná `Grid templateColumns`. Nadpisy sekcí nikdy jako skeleton
  (jsou statické).
- **Primitiva v caio-ui** (`UiElements.Skeleton.Line` / `.Block` / `.Logo`) místo uu5 `Skeleton`, který má
  studenou šedou, nekonečný shimmer bez `prefers-reduced-motion` a `role="alert"` na každém kusu.

| Vlastnost | Hodnota |
|---|---|
| Výplň | `Theme.color.border` (stejná role v obou režimech a obou webech, ~1,3:1) |
| Zaoblení | řádky textu 4 px, bloky a fotky 8 px, loga jako rámeček `TeamLogo`, fotky osob `full` |
| Řádek textu | inline-block `height: 0.7em` uvnitř skutečného `Uu5Elements.Text` téže kategorie (výška řádku sedí) |
| Šířky řádků | pevné, ne náhodné: nadpis 60 %, odstavec 100/94/68 %, jméno týmu 70 % |
| Pohyb | pulse (opacity 1 → 0,5 → 1), 1,6 s ease-in-out, `animation-delay: 300ms`; bez shimmeru; reduced motion = statické |
| Přístupnost | kusy `aria-hidden`; sekce `aria-busy="true"` + skrytý `role="status"` „Načítám {sekce}“ |
| Tmavé sekce (hero, červený pás) | bez skeletonu, obsah je statický |
| Přechod na obsah | obsah opacity 0 → 1, 150 ms ease-out; nikdy neanimovat výšku; reduced motion 0 ms; LCP obrázek a hero bez fade |
| Znovunačtení s daty | data zůstávají (`aria-busy`, volitelně opacity 0,6), nikdy skeleton ani spinner |

- **Po sekcích:** dlaždice zápasu (2× logo + jméno 70 %, skóre 48×32 px, patička 40 %, počet 3); tabulka
  (skutečná hlavička + N řádků skutečné výšky, N = 14); ceník Roubeného ráje (karty, počet 3);
  galerie (stejná mřížka, `aspect-ratio` boxy v `muted`).

#### D. Souvislý start a navigace

- **Hotovo pro afkbratcice (2026-11-24), aplikačně bez devkitu:** `client/src/core/boot-screen.jsx` přesune `#app-loading`
  před renderem z `#root` do `body`, `BootReady` v `Suspense` routy ho pustí po vykreslení a po písmech a ikonách lišty.
- **Boot screen až do prvního obsahu:** devkit nechá `#app-loading` mimo `#root`, aplikace ho odstraní,
  když první routa vykreslí obsah (fade 200 ms, 0 ms při reduced motion). Fáze `AppProvider` a první fallback
  pak nekreslí nic vlastního. Logo boot screenu inline (data URI) nebo preload. Změna caio-devkit.
- **Navigace uvnitř appky (zbylé lazy routy):** prvních 400 ms nic; potom kruh 64 px ve stylu boot screenu,
  fade 200 ms, zobrazený aspoň 500 ms; 2px indeterminate proužek u spodní hrany lišty (`clubRed` / `primary`,
  reduced motion = statický 30 %). Prefetch chunku na `pointerenter`/`focus`/`touchstart` odkazu v menu.
- **Dlouhé čekání a chyby:** po 8 s „Načítání trvá déle než obvykle.“ (`mutedFg`); po 20 s nebo při
  selhání importu chunku „Stránku se nepodařilo načíst.“ + „Načíst znovu“ (ve fázi boot jen text, bez tlačítka);
  offline text a automatický retry na událost `online`. Nové texty do lokalizace obou webů.
- Zápas: `match/list` spustit souběžně s `match/get`, pokud to API dovolí.
- **Vyřazeno z verze 1:** prefetch v `main.jsx` (nahrazuje A3), `manualChunks` do jednoho chunku (chunky už jdou
  souběžně), `modulepreload` (build je SystemJS s `modulePreload: false`, `caio-devkit …/vite/base-config.js:189`),
  agregační `home/get` (home nad ohybem nemá data), `fetchpriority` hero loga (`UiElements.Image` nemá
  `loading="lazy"`, logo je už stažené z lišty).

#### E. Písma

- Přenést `buildFontHeadTags` z propertymanu do caio-devkit jako volbu (devkit už do `<head>` vkládá).
- Preload jen **Bebas latin + latin-ext** (wordmark „BRATČICE“: `Č` je v latin-ext, jinak se vykreslí dvěma písmy)
  a **Barlow 400 latin**. Ne všech 8 souborů (~120 kB by na pomalé síti konkurovalo uu5 knihovnám).
- `font-display: swap` zůstává (Bebas je identita webu).
- Metricky upravené fallbacky (`size-adjust`, `ascent-override`, počítané nástrojem capsize/fontaine) jen pokud
  test na 360 px ukáže přetečení h1 96 px v Robotu. Naměřený dopad C8 je zanedbatelný.

---

## 6. Co se mění v každé appce

### Fáze 1

- **afkbratcice:** `router.jsx` (obal routy s min-výškou, statické importy malých rout), `page-loading.jsx`
  (výška), `routes/teams.jsx` (rezerva trenérů), historie (podle diagnózy), značka `route-content-ready`.
- **propertyman:** `pricing.jsx`, `availability-calendar.jsx`, `routes/home.jsx` (`ESTIMATE`, `#recenze`).
- **caio-ui, caio-devkit:** beze změny.
- **Měřicí skript:** CWV metrika, běhy, značka (zůstává mimo repo, viz otázka 4).

### Fáze 2 (po schválení každého bodu)

- **caio-ui:** `UiElements.SectionSlot` (minimální API), primitiva `Skeleton`, README. Aditivní 0.4.x.
- **caio-devkit:** volba `fonts`; boot screen mimo `#root` s API pro odstranění.
- **afkbratcice:** skeletony podle specifikace, stavy dlouhého čekání a offline, prefetch v menu.
- **propertyman:** `LazySection` → `SectionSlot`, skeletony ceníku, `font-head.js` → devkit.

---

## 7. Cíl a ověření

Měřit rozšířeným skriptem (A7), stejným profilem, **≥ 3 běhy** na konfiguraci, hlásit medián a maximum.

| Metrika | Cíl po fázi 1 |
|---|---|
| CLS (CWV, okna) na každé routě, mobil i desktop, první návštěva | afkbratcice **≤ 0,05** medián, **≤ 0,1** maximum; propertyman **≤ 0,01** |
| Patička ve viewportu před `route-content-ready` | nikdy (sleduje i home mobil, kde CLS selhává) |
| Posun prvku ve viewportu | žádný na `/muzstvo`, `/zapas`, `/zajimavosti`, `/kontakt`, home |
| Skok na kotvu / Zpět | dojede na místo ± 50 px |
| Drift výšky ve scrollu (propertyman, home) | ≤ ± 5 % |
| Vizuální kontrola (filmový pás boot → obsah, světlý/tmavý, 360/1280) | nejvýš 2 různé vzhledy načítání, žádná patička před obsahem |

Výsledek měření rozhodne o fázi 2. Cíl „změna výšky dokumentu ≤ 10 %“ z verze 1 vypadl: uživatel ji nevidí
a odporuje lazy sekcím.

Před hotovo dál: `npm test`, `npm run smoke`, ruční průchod v prohlížeči.

---

## 8. Odhad práce

### Fáze 1

| Část | Odhad |
|---|---:|
| A1 obal routy + `PageLoading` | 0,25 d |
| A3 statické importy malých rout, kontrola velikosti bundle | 0,25 d |
| A4 rezerva trenérů | 0,25 d |
| A5 diagnóza a oprava historie | 0,5 d |
| A6 propertyman (ceník, kalendář, odhady) | 0,25 d |
| A7 rozšíření měření, měření před/po (14 konfigurací × 3 běhy) | 0,5 d |
| **Celkem** | **≈ 2 d** |

Očekávání (`inferred` z testu se skrytou patičkou): afkbratcice na všech routách ≈ 0–0,05.

### Fáze 2 (orientačně, každý bod zvlášť)

| Část | Odhad |
|---|---:|
| B `SectionSlot` v caio-ui + přechod propertymanu | 1,5 d |
| C primitiva skeletonu + skeletony (≈ 8 obrazovek) | 2 d |
| D souvislý boot screen (devkit) + navigační loader + dlouhé čekání/offline | 1,5–2 d |
| E písma v devkitu (+ metrické fallbacky, pokud budou potřeba) | 0,5–1 d |
| Vydání caio-ui/devkit, bump ve dvou appkách, kontrola `caio-apps` | 0,5 d |
| **Celkem** | **≈ 6–7 d** |

---

## 9. Otevřené otázky

1. **Mezera nad patičkou u krátkých stránek (A1):** je přijatelné, že na `/kontakt` (mobil) bude ~150 px volného
   místa a patička až po scrollu? Jinak A2 (skrytá patička přes kontext aplikace).
2. **Statické importy (A3):** souhlas, že lazy zůstane jen `page.jsx` a těžké knihovny?
3. **Fáze 2:** rozhodovat až podle měření po fázi 1, nebo některé body (např. souvislý boot screen D) chceš
   i bez ohledu na CLS kvůli vnímané rychlosti?
4. **Kam patří měřicí skript:** do `caio-devkit` jako příkaz (`measure-cls <url>`, vyžaduje Edge/Chrome), nebo do `tools/` v appkách?
5. **Cílové profily sítě:** stačí slow 4G + CPU 4×, nebo přidat „Fast 3G“?
6. **Propertyman bundle:** bez lazy rout zůstává (nulové CLS), LCP je samostatné téma. Mimo rozsah.

---

## 10. Revize: co se změnilo proti verzi 1

Návrh zrevidovali dva recenzenti: **architekt** (verdikt „přepracovat“) a **designer** (verdikt „schválit
s úpravami“). Hlavní tvrzení jsem ověřil v kódu a v naměřených datech.

| Nález | Zdroj | Ověřeno | Změna |
|---|---|---|---|
| Skrytí patičky jen během fallbacku `Suspense` nestačí: největší posuny patičky přicházejí ve fázi dat (zápas 0,595 po `match/list`). Tvrzení „A sama ≈ 0–0,17“ neplatilo | architekt | ano, časy a zdroje posunů v `raw/res-*` | A → A1 (trvalá rezerva obalu routy), A2 jako záloha |
| A nepatří do caio-ui: patička i `DataState` jsou komponenty aplikace; `AppProvider` je nad `Spa`, kontext z `Page` tam neexistuje | architekt | ano, `app.jsx:113-141` | fáze 1 bez změny caio-ui |
| Skeletony (C) a učená výška (B) skoro nesníží CLS: obsah je pod ohybem, po skrytí patičky CLS 0 | architekt | ano, `raw/nf-*` | přesunuto do fáze 2, učená výška vyřazena |
| Historie: obsah je statický, posuny dělá `VerticalTimeline` (lazy chunky, ikony) | architekt | ano, `history.jsx:20-29`, `history-timeline.jsx:55` | C3 přepsáno, A5 |
| Skript sčítá posuny, CWV používá okna; 1 běh je málo; LCP = logo boot screenu | architekt | ano, `cls.mjs:44`; CWV přepočteno z dat | tabulky s oběma čísly, nové cíle, A7 |
| D: `modulepreload` nejde (SystemJS, `modulePreload: false`), `manualChunks` vlnu neodstraní, `home/get` bez efektu | architekt | ano, `base-config.js:189` | D1–D3, D5 vyřazeny; náhrada A3 (statické importy) |
| `SectionSlot` dubluje `DataState` (stavy, chyby, LSI) | architekt | ano, `data-state.jsx:71-86` | minimální API bez stavů |
| C7: rezervy v propertymanu existují, jen špatně velké; ceník při `pending` s daty ukáže spinner | architekt + designer | ano | A6 |
| `MATCH_TILE_HEIGHT` v kódu neexistuje, výška dlaždice závisí na obsahu | designer | ano (grep) | pravidlo „skeleton = skutečný kontejner“ |
| Start prochází třemi nesouvisejícími vizuály, uuGDS `content.content_states` to zakazuje | designer | z kódu | D: souvislý boot screen |
| Vizuál skeletonu nebyl specifikován; uu5 `Skeleton` má `role="alert"` na každém kusu a shimmer bez reduced motion | designer | z bundle uu5g05 | C: vizuální specifikace |
| Chybí stavy dlouhého čekání, offline, selhání chunku | designer | ano | D |
| Písma: `Č` v latin-ext, fallback na Androidu je Roboto | designer | `fonts.css`, `client.config.js:20` | E: preload latin + latin-ext pro Bebas |
| Preload všech 8 woff2 by konkuroval knihovnám; `size-adjust` má zanedbatelný efekt | architekt | z dat (C8 0,0001–0,0003) | E: preload 3 souborů, metrika jen podle testu |

**Rozpor mezi recenzenty a jak je rozhodnut:**
- **Písma:** architekt preload jen latin a `size-adjust` zbytečný; designer latin + latin-ext a `size-adjust`.
  Rozhodnutí: Bebas latin + latin-ext (kvůli `Č`), Barlow jen latin; `size-adjust` až po testu na 360 px.
- **Skeletony:** architekt je považuje za zbytečné pro CLS, designer pro ně dodal specifikaci.
  Rozhodnutí: fáze 2, specifikace platí, až se budou dělat.

**Neověřeno:** zda uu5g05 `setRoute` běží jako React transition (ovlivnilo by navigační loader v D);
zdroj posunu historie v 26,97 s; hodnoty metrických fallbacků písem.

---

## Příloha: měření a skript

Mimo repo (nic se do appek nepřidalo): `…\side-session-notes\local_ffeaff88-25cc-4fd3-a175-b8b4313ff9bf\section-loading\`

- `cls.mjs`: `node cls.mjs <url> <slow4g|3g|none> <šířka> <výška>`; proměnné `SCROLL=1` (po načtení prosroluje stránku
  a změří posuny při doplňování lazy sekcí), `FILM=<prefix>` (screenshot při každé změně výšky), `NOFOOTER=1` (test „bez patičky“).
  Vyžaduje Edge a Node ≥ 22 (globální `WebSocket`). CLS hlásí jako součet; CWV okna doplní A7.
- `sum.py`: krátký přehled z JSON výstupu.
- `raw/`: všechna naměřená data (`res-*` afkbratcice, `pm-*` propertyman, `scroll-*`, `nf-*`) a tři screenshoty startu.
