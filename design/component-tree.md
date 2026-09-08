# Strom komponent — z čeho se web složí

Datum: 2026-09-05 · revize proti hotovému serveru 2026-09-06

**Co tenhle dokument je:** rozpad každé obrazovky na komponenty, s vyznačením, co dodává
`uu5g05`, co `caio-ui` a co si musí appka napsat sama. Slouží k odhadu práce a k tomu, aby se
při implementaci nezakládaly vlastní komponenty tam, kde už něco existuje.

**Co není:** zadání (to je [frontend.md](./frontend.md)) ani vzhled
(to je [ux-design-system.md](./ux-design-system.md)).

Na rozdíl od `caio_propertyman/docs/component-tree.md` je tu jen **cílový stav** — appka
zatím neexistuje, není co odečítat ze zdrojáků.

> **Základní pravidlo:** červený uzel (naše komponenta) je vždycky **jen složení a konfigurace**
> uu5 komponent, ne vlastní HTML se stylem. Kde v diagramu vidíte krémový uzel (holé HTML),
> je to buď záměr (sémantika `<section>`, `<h2>`, `<table>`), nebo dluh — a je u něj napsáno co.

---

## Legenda diagramů

| Barva | Význam |
| --- | --- |
| červená | naše komponenta (`client/src/components/**`, `routes/**`) |
| tmavě hnědá | komponenta z `caio-ui` (`UiApp`, `UiAuth`, `UiElements`) — `UiEcc` se nepoužívá, viz D.4 |
| šedá | komponenta z uu5 (`Uu5Elements`, `Uu5Forms`, `Uu5Tiles`, `Uu5Imaging`) |
| světlá | sémantické HTML + `Config.Css.css()` |
| přerušovaná | data: use case API, `content/*.js` nebo klíč v `lsi/cs.json` |

```
classDef own  fill:#D01319,color:#FEF7F2,stroke:#D01319
classDef caio fill:#2A1B19,color:#F3EFED,stroke:#2A1B19
classDef uu5  fill:#55504E,color:#F3EFED,stroke:#55504E
classDef html fill:#F3EFED,color:#120D0C,stroke:#99908E
classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

---

# Část A — rám aplikace

Rám **dodává `caio-ui`**: `UiApp.Spa` dostane `top`, `footer` a `main` a složí lištu +
`<main>` + patičku. Appka nemá vlastní `Page` ani `Header` — jen konfiguraci v `app.jsx`.

```mermaid
flowchart TD
  main0["main.jsx<br/>createRoot().render(App)"]:::own
  app["app.jsx<br/>konfigurace TOP: logo, children, menu,<br/>cssBackground, cssColor, sticky=always<br/>+ UuGds.setMeaningColor(primary, #D01319)"]:::own
  spacing["Uu5Elements.SpacingProvider type=loose<br/>web, ne aplikace"]:::uu5
  provider["UiApp.SpaProvider<br/>languageList=[cs], cmdPrefix=/auth<br/>-> AppBackground + LanguageList + Language<br/>+ UiAuth.SessionProvider + Route"]:::caio
  spa["UiApp.Spa<br/>top, footer, main<br/>-> ErrorBoundary + ModalBus + AlertBus"]:::caio
  cpage["UiApp.Page<br/>TopProvider + Top + main + footer<br/>sticky=always JE PROP PAGE, ne lišty"]:::caio
  ctop["Top (neexportovaný)<br/>logo, Header, ActionGroup menu"]:::caio
  cmain["main<br/>padding=false -- sekce si ho řeší samy"]:::caio
  appctx["core/app-context.jsx<br/>appConfig/get + season/listCurrent + team/list<br/>kategorie NEJSOU v konfiguraci -- odvozují se ze sezón"]:::own
  router["router.jsx<br/>useRouter(routeMap) + Suspense + ErrorBoundary"]:::own
  routes["routes/** (lazy)"]:::own
  notice["components/layout/notice-bar.jsx"]:::own
  footer["components/layout/footer.jsx"]:::own
  cfg["appConfig/get + season/listCurrent<br/>-> kategorie, menu, routy"]:::data
  teams["team/list -> mapa teamId => { name, shortName, logoUri }<br/>match/list vrací JEN id týmů"]:::data

  main0 --> spacing --> provider --> spa --> cpage
  cpage --> ctop
  cpage --> cmain
  cpage --> footer
  app -.-> spa
  cmain --> notice
  cmain --> appctx --> router --> routes
  appctx -.-> cfg
  appctx -.-> teams

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef caio fill:#2A1B19,color:#F3EFED,stroke:#2A1B19
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef html fill:#F3EFED,color:#120D0C,stroke:#99908E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

**Mapa týmů patří do rámu, ne do obrazovek.** `match/list` vrací jen `homeTeamId`
a `guestTeamId` — týmy dotahuje pouze `match/get`. Bez sdílené mapy by si ji každá obrazovka
se seznamem zápasů (home, zápasy týmu, kolo, detail zápasu, profil hráče) skládala zvlášť.

## A.1 Horní lišta

```mermaid
flowchart TD
  top["TOP objekt v app.jsx<br/>(ne komponenta -- konfigurace)"]:::own
  ctop["Top z caio-ui<br/>withStickyTop, sticky=always,<br/>po dosednutí GDS elevationUpper"]:::caio
  logo["logo: { uri: assets/meta/icon-192.png, href: home }"]:::own
  hdr["Uu5Elements.Header<br/>title=AFK Bratčice, subtitle=od roku 1932<br/>+ className -> fontFamily Bebas na vnitřní Text"]:::uu5
  ag["Uu5Elements.ActionGroup<br/>měří šířku, sbalí na ikonu -> hamburger<br/>MOBIL ŘEŠÍ SÁM, nic se nenastavuje"]:::uu5
  items["menu.itemList z app-contextu:<br/>Aktuality, Program, Historie, Mužstva*, Fotogalerie,<br/>Ke stažení, Kontakt<br/>(*podpoložky ze season/listCurrent -- dynamické)"]:::own
  ident["UiAuth.IdentityItem / položka Přihlásit se<br/>-> useSession().login() -- Top ji sám nepřidává"]:::caio
  nav["lsi/cs.json: header.nav.*"]:::data

  top --> ctop
  ctop --> logo
  ctop --> hdr
  ctop --> ag --> items
  ag --> ident
  items -.-> nav

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef caio fill:#2A1B19,color:#F3EFED,stroke:#2A1B19
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

**Past (a jak dopadla):** `Uu5Elements.Header` nemá token pro font — title i subtitle
renderuje jako `Uu5Elements.Text` s vlastní explicitní `font-family`. Cesta přes cílenou
třídu na `[data-name="Uu5Elements.Text"]` **v produkci nefunguje**: `data-name` je vývojová
pomůcka, kterou uu5 v produkčním buildu nevypisuje, takže název klubu byl v devu Bebas
a v ostrém provozu Barlow — rozdíl, který v devu nejde uvidět (nalezeno 7. 9. 2026, stejná
chyba byla i v propertymanu).

Řešení: název klubu se **skládá z vlastních elementů**, ne z `Uu5Elements.Header`. Velikost
dál počítá GDS (`Uu5Elements.Text` s `children` jako funkcí, stejně jako `Heading`), přebíjí
se jen rodina písma, prostrkání a verzálky.

> **Pravidlo:** `data-name` se nesmí objevit v selektoru. Když se komponenta nedá nastavit
> propsy, skládá se vlastní obal — ne selektor do jejího vnitřku.

---

# Část B — sdílené primitivy

Na tyhle uzly se odkazují všechny diagramy níž. Je to celý „design systém“ appky —
deset komponent, každá tenká obálka nad uu5.

```mermaid
flowchart TD
  section["Section<br/>variant=plain|hatched|red, id, padTop<br/>maxWidth 1152, padInline 16|24, padBlock 64"]:::own
  bgp["Uu5Elements.BackgroundProvider<br/>background=dark (celý web je tmavý)<br/>-> uu5 potomci volí správnou variantu z GDS"]:::uu5
  sectionEl["section (sémantické HTML) + div"]:::html

  heading["Heading level, eyebrow<br/>eyebrow + h2 s červeným pruhem 4px vlevo"]:::own
  text["Uu5Elements.Text category/segment/type<br/>VELIKOST VŽDY Z uuGds -- theme.js nemá fontSize<br/>children jako funkce -> style; GDS řeší i smallScreen"]:::uu5
  headingEl["h1 | h2 | h3, margin 0<br/>+ fontFamily, letterSpacing, textTransform z theme"]:::html

  eyebrow["Eyebrow<br/>12/16, ls .25em, uppercase, barva clubRed"]:::own

  card["Card highlighted?, topStripe?"]:::own
  tile["Uu5Elements.Tile<br/>colorScheme dle GDS, borderRadius=moderate,<br/>padding ze SpacingProvideru"]:::uu5

  button["Button significance, size, onRed?, href"]:::own
  uubtn["Uu5Elements.Button<br/>significance highlighted|distinct|subdued<br/>colorScheme=primary (klubová červená)"]:::uu5

  grid["Uu5Elements.Grid<br/>templateColumns=repeat(auto-fill|fit, minmax(min, 1fr))<br/>mezery ze SpacingProvideru"]:::uu5

  badge["Badge kind=category|result<br/>A-TÝM / MLÁDEŽ / VETERÁNI, VÝHRA / REMÍZA / PROHRA"]:::own
  uubadge["Uu5Elements.Tag / Uu5Elements.Badge"]:::uu5

  photo["Photo src, ratio, caption, alt"]:::own
  uuimg["UiElements.Image (img + referrerPolicy)<br/>loading=lazy, objectFit=cover"]:::caio

  dt["DateText value, format<br/>jednotné cs-CZ formátování, Intl"]:::own
  logo2["TeamLogo uri, size<br/>fallback na klubový erb"]:::own

  empty["EmptyState icon, lsi, action?<br/>kategorie bez sezóny, sezóna bez zápasů,<br/>soutěž bez tabulky, album bez fotek"]:::own
  uuempty["Uu5Elements.Text + Uu5Elements.Icon<br/>uvnitř Card"]:::uu5

  section --> bgp --> sectionEl
  empty --> uuempty
  heading --> eyebrow
  heading --> text --> headingEl
  card --> tile
  button --> uubtn
  badge --> uubadge
  photo --> uuimg
  logo2 --> uuimg

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef caio fill:#2A1B19,color:#F3EFED,stroke:#2A1B19
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef html fill:#F3EFED,color:#120D0C,stroke:#99908E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

---

# Část C — bez bočního panelu

Současný web má na každé stránce pravý sloupec (upozornění, poslední/následující zápas,
zkrácená tabulka). **Nová verze ho nemá** — je to dvousloupcový vzor z roku 2010, na mobilu
z něj stejně padá dlouhý ocas pod obsah a předloha ho nezná. Obsah se nezahazuje, jen
přesouvá: upozornění je proužek pod lištou, zápasy a tabulka jsou plné sekce na home.

Jediné, co z panelu zbývá jako komponenty:

```mermaid
flowchart TD
  nb["NoticeBar<br/>úzký proužek pod lištou, zavíratelný<br/>stav v sessionStorage"]:::own
  alert["Uu5Elements.Alert colorScheme=warning"]:::uu5
  cd["Countdown targetTime<br/>useInterval 1s -> 'za 6 dnů 18:52:15'<br/>useVisibility -> na pozadí netiká"]:::own
  mtile["MatchTile (karta nejbližšího zápasu na home)"]:::own
  cfg["appConfig.notice"]:::data

  nb --> alert
  nb -.-> cfg
  mtile --> cd

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

`Countdown` je jediná komponenta v celé appce s vlastním intervalem.

---

# Část D — veřejné obrazovky

## D.1 Home

```mermaid
flowchart TD
  home["routes/home.jsx"]:::own
  hero["HeroSection<br/>fullbleed foto + overlay + erb + h1 + 2 CTA"]:::own
  stats["StatsStrip<br/>3 dlaždice: 1932 / 3 / 90+"]:::own
  next["WeekendProgram<br/>program víkendu napříč kategoriemi<br/>sekce na home, NE vlastní routa"]:::own
  last["LastResultsSection"]:::own
  news["NewsSection<br/>3 nejnovější články"]:::own
  tables["TablesSection<br/>přepínač kategorií + plná tabulka"]:::own
  cta["CtaBand<br/>plná červená plocha + tlačítko"]:::own

  sec["Section"]:::own
  head["Heading"]:::own
  grid["Uu5Elements.Grid"]:::uu5
  mtile["MatchTile"]:::own
  rtile["ResultTile (skóre chip + Badge)"]:::own
  atile["ArticleTile (Photo + Badge + DateText)"]:::own
  stab["StandingsTable variant=full"]:::own
  tabs["Uu5Elements.Tabs"]:::uu5
  btn["Button"]:::own

  a1["match/list?teamIdList&dateFrom&dateTo"]:::data
  a2["match/getLast (n x)"]:::data
  a3["article/list pageSize=3"]:::data
  a4["stats/getTable"]:::data

  home --> hero & stats & next & last & news & tables & cta
  next --> sec --> head
  next --> grid --> mtile
  last --> rtile
  news --> atile
  tables --> tabs --> stab
  cta --> btn
  next -.-> a1
  last -.-> a2
  news -.-> a3
  tables -.-> a4

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

## D.2 Mužstva, soupiska, zápasy, tabulka, statistiky

Čtyři routy jednoho týmu (`team`, `team/matches`, `team/table`, `team/stats`) sdílí hlavičku
s přepínačem sezóny a záložkami — ta je vlastní komponenta, ne čtyři kopie.

```mermaid
flowchart TD
  teams["routes/teams.jsx -- přehled mužstev"]:::own
  tcard["TeamCard<br/>Photo + Badge + perex + 3 řádky s ikonami + Button"]:::own

  shell["TeamShell id, seasonId<br/>hlavička + SeasonSelect + Uu5Elements.Tabs"]:::own
  ssel["SeasonSelect -> Uu5Forms.Select"]:::own

  roster["routes/team.jsx -- soupiska"]:::own
  ptile["PlayerTile<br/>foto, číslo, jméno, věk, Z/G/ŽK/ČK"]:::own
  grp["PositionGroup Brankáři|Obránci|Záložníci|Útočníci"]:::own
  staff["CoachList -> InfoItem"]:::own

  matches["routes/team-matches.jsx<br/>Tabs Rozpis | Výsledky + ics odkaz"]:::own
  table2["Uu5Tiles.Table (uu5tilesg02)<br/>kolo, datum, domácí, hosté, výsledek"]:::uu5
  filt["Uu5Forms.SwitchSelect vše | doma | venku"]:::uu5
  roundv["routes/round.jsx -- celé kolo soutěže"]:::own
  d6["match/list?seasonId&round"]:::data

  tbl["routes/team-table.jsx"]:::own
  stab["StandingsTable variant=full"]:::own

  stats["routes/team-stats.jsx"]:::own
  stab2["Uu5Tiles.Table -- střelci, karty, starty"]:::uu5

  d1["team/list, season/getCurrent, coach/list"]:::data
  d2["player/list?teamId&active"]:::data
  d3["match/list?teamId&seasonId&state&order"]:::data
  d4["stats/getTable"]:::data
  d5["stats/listPlayerStats"]:::data

  teams --> tcard
  teams -.-> d1
  shell --> ssel
  shell --> roster & matches & tbl & stats
  roster --> grp --> ptile
  roster --> staff
  roster -.-> d2
  matches --> filt
  matches --> table2
  matches -.-> d3
  roundv --> table2
  roundv -.-> d6
  tbl --> stab
  tbl -.-> d4
  stats --> stab2
  stats -.-> d5

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

`StandingsTable` je **vlastní komponenta, ne `Uu5Tiles.Table`** — má zvýrazněný vlastní tým,
skrývá sloupce VP/PP na `xs` a renderuje `<table>` kvůli sémantice a SEO. Zápasy naopak
`Uu5Tiles.Table` používají, protože chtějí řazení a filtry zdarma.

## D.3 Detail zápasu

```mermaid
flowchart TD
  m["routes/match.jsx"]:::own
  head["MatchHeader<br/>2x TeamLogo, skóre, poločas, penalty, kolo, datum, hřiště"]:::own
  lineup["LineupTable domácí | hosté<br/>základ / střídající, góly, karty"]:::own
  scorers["ScorersList -- souhrn z playerList"]:::own
  round["RoundResults<br/>Ostatní výsledky N. kola -> routa round"]:::own
  h2h["HeadToHead<br/>poslední 3 vzájemné zápasy"]:::own
  arts["ArticleTile[] -- reporty ze zápasu"]:::own
  gal["PhotoGrid -- alba navázaná na zápas"]:::own
  dep["DepartureInfo -- jen profil members"]:::own
  act["Uu5Elements.ActionGroup<br/>Zapsat výsledek | Zapsat sestavu (operatives)"]:::uu5
  modal["Uu5Elements.Modal + Uu5Forms.Form"]:::uu5

  d1["match/get (+ homeTeam, guestTeam, playerList)"]:::data
  d2["match/list?seasonId&round"]:::data
  d3["article/list?matchId"]:::data
  d4["gallery/list?matchId"]:::data

  m --> head & lineup & scorers & round & h2h & arts & gal & dep & act
  act --> modal
  m -.-> d1
  round -.-> d2
  h2h -.-> d5["match/list?teamId&opponentId"]:::data
  arts -.-> d3
  gal -.-> d4

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

`RoundResults` (**„Ostatní výsledky N. kola“**) je převzaté ze současného webu — v původním
návrhu chybělo.

## D.4 Novinky, článek, obsahová stránka

```mermaid
flowchart TD
  news["routes/news.jsx -- seznam"]:::own
  pag["Uu5Elements.Pagination"]:::uu5
  atile["ArticleTile"]:::own

  art["routes/article.jsx -- detail"]:::own
  ahead["ArticleHeader<br/>titulek, DateText, autor, Photo"]:::own
  mref["MatchRefPanel -- když je matchId"]:::own
  content["Content uu5String<br/>Utils.Uu5String.toChildren(content)"]:::own
  seclist["SectionList<br/>page.sectionList -> Section + Content na položku<br/>sekce jsou vložené v dokumentu stránky"]:::own

  page["routes/page.jsx -- obsahová stránka<br/>history, hymn, contact, board, training, team-photos"]:::own
  edit["ContentEditModal<br/>name, desc + uu5codekitg01-forms na každou sekci<br/>ukládá celý sectionList; ZATÍM KÓD, ne WYSIWYG"]:::own
  ck["uu5codekitg01-forms"]:::uu5
  tl["Uu5Bricks.VerticalTimeline + .Item<br/>registrované do uu5String -> redakce je píše do obsahu<br/>historie klubu 1932-2022"]:::uu5

  d1["article/list -- bez content"]:::data
  d2["article/get -- včetně content"]:::data
  d3["page/get?code -- vrací i sectionList<br/>žádný překlad code -> id"]:::data

  news --> atile
  news --> pag
  news -.-> d1
  art --> ahead & mref & content
  art --> edit
  art -.-> d2
  page --> seclist --> content
  page --> edit
  page -.-> d3
  edit --> ck
  content --> tl

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef caio fill:#2A1B19,color:#F3EFED,stroke:#2A1B19
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

**`UiEcc` se nepoužívá** (rozhodnuto 2026-09-06). ECC v `caio-server` není a jeho design se
ladí samostatně, takže obsah drží entity samy: **článek jeden `uu5String` v `content`,
stránka pole sekcí `sectionList: [{ content }]`**. Zobrazení je `Utils.Uu5String.toChildren()`,
editace jeden modal s `uu5codekitg01-forms` — **zatím se píše kód, ne WYSIWYG**.

Sekce jsou **vložené v dokumentu stránky**, ne vlastní kolekce, a jsou to **objekty, ne holé
stringy** — nadpis sekce, kotva nebo varianta podkladu se pak přidají bez migrace, a až
vznikne ECC, každý objekt se stane dokumentem `ecc_section`. Ukládá se `sectionList` celý;
`createSectionBefore/After` a `updateSectionOrder` z ECC kontraktu odpadají.

Co tím padá: `eccPage/getByCode` a s ním riziko #12 (`UiEcc.Page` nebere `code`), zámky
sekcí, `contentMap` po jazycích a autorizace sekce podle toho, čí je stránka — články
a stránky jsou dvě entity se dvěma rolemi (`NEWS` / `PAGES`), takže se to řeší samo.
Co tím naopak přibývá: `Content`, `SectionList` a `ContentEditModal` jsou **tři vlastní
komponenty navíc**, zato `Content` a `ContentEditModal` sdílené mezi článkem i stránkou.

Obsahové stránky: `history` (včetně časové osy milníků), `hymn`, `contact`, `board`
(Výbor AFK), `training`, `team-photos`. Časová osa se pořád registruje do `uu5String`,
jen ji redakce píše do sekce stránky.

## D.5 Fotogalerie, soubory, profil hráče

```mermaid
flowchart TD
  gl["routes/gallery.jsx -- seznam alb"]:::own
  chips["Uu5Forms.SwitchSelect -- filtr kategorií"]:::uu5
  gtile["GalleryTile coverThumbUri, název, datum, počet"]:::own

  gd["routes/gallery-detail.jsx"]:::own
  pgrid["PhotoGrid<br/>Grid + Photo(thumbUri) + IntersectionObserver"]:::own
  lb["Lightbox -> Uu5Elements.Modal + UiElements.Image(uri)"]:::own

  files["routes/files.jsx -- ke stažení"]:::own
  frow["FileRow ikona typu, název, datum, velikost -> binary.uri"]:::own

  pl["routes/player.jsx -- profil hráče"]:::own
  pcard["PlayerCard foto, post, číslo, roky v klubu"]:::own
  ptab["Uu5Tiles.Table -- statistiky po sezónách"]:::uu5

  nf["routes/not-found.jsx<br/>404 + odkazy na hlavní sekce"]:::own

  d1["gallery/list"]:::data
  d2["gallery/listPhotos"]:::data
  d3["file/list"]:::data
  d4["player/get + stats/getPlayerStats"]:::data

  gl --> chips & gtile
  gl -.-> d1
  gd --> pgrid --> lb
  gd -.-> d2
  files --> frow
  files -.-> d3
  pl --> pcard & ptab
  pl -.-> d4

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef uu5 fill:#55504E,color:#F3EFED,stroke:#55504E
  classDef data fill:#D8D2D0,color:#120D0C,stroke:#99908E,stroke-dasharray:3 3
```

---

# Část E — správcovské obrazovky

Sedm z dvanácti admin obrazovek je **jen konfigurační objekt** — žádná vlastní komponenta.

```mermaid
flowchart TD
  gen["admin/<entita>.jsx<br/>~40 řádků: CONFIG + Crud.generate()"]:::own
  ctx["UiElements.CrudContext.create(entita)<br/>-> [Provider, useHook] nad entita/list|create|update|delete|deleteMany"]:::caio
  crud["UiElements.Crud<br/>tabulka + create/edit/delete modály + hromadné mazání"]:::caio
  gencol["Crud.generate(cfg) -> seriesList, columnList, sorterList, filterList"]:::caio
  geninp["Crud.generateInputs(cfg) -> pole Uu5Forms inputů"]:::caio
  ff["UiElements.FormFile -> Uu5Imaging.ImageInput | Uu5Forms.File"]:::caio
  bprov["UiElements.BinaryProvider collection=download"]:::caio

  spec1["admin/matches -- navíc modály<br/>Zapsat výsledek / Zapsat sestavu / Hromadně (JSON)"]:::own
  spec2["admin/articles + admin/pages<br/>navíc ContentEditModal (uu5codekitg01-forms)"]:::own
  spec3["admin/identities -- identity/adminList + update<br/>teamEditor:id se zobrazuje jako název týmu"]:::own
  spec4["admin/files -- VLASTNÍ Crud konfigurace<br/>category + date; BinaryCrud je nerozšiřitelná"]:::own

  gen --> ctx --> crud
  crud --> gencol & geninp
  geninp --> ff
  spec4 --> bprov
  spec4 --> crud
  gen -.-> spec1 & spec2 & spec3 & spec4

  classDef own fill:#D01319,color:#FEF7F2,stroke:#D01319
  classDef caio fill:#2A1B19,color:#F3EFED,stroke:#2A1B19
```

**`admin/files` už není nulová konfigurace.** `UiElements.BinaryCrud` kolekci umí
(`collection="file"`), ale je záměrně nerozšiřitelná přes props — a `file/list` filtruje
podle `category` a řadí podle `date`, což jsou pole, která by tak nikdo nezapsal a stránka
„Ke stažení" by zůstala jedním nesekcovaným seznamem. Skládá se proto vlastní `Crud`
konfigurace nad `BinaryProvider`, přesně tou cestou, kterou README `caio-ui` předepisuje.

**Guard pro `teamEditor`.** `UiApp.withRoute` bere rozsahové profily jako `"teamEditor:*"`
(doplněno do `caio-ui` 2026-09-06); *které* týmy to jsou, si obrazovka zjistí přes
`UiAuth.getScopeList(identity, "teamEditor")` (viz [frontend.md](./frontend.md), 2.2).

---

# Část F — souhrn

## F.1 Kolik toho musíme napsat

| Vrstva | Počet | Odkud |
|---|---|---|
| Rám, routing guard, session, CRUD UI, upload | 0 vlastních | `caio-ui` |
| Primitivy designu (Section, Heading, Eyebrow, Card, Button, Badge, Photo, DateText, TeamLogo, EmptyState) | **10** | vlastní, tenké obálky nad uu5 |
| Globální drobnosti (NoticeBar, Countdown) | **2** | vlastní |
| Doménové komponenty (MatchTile, ResultTile, ArticleTile, PlayerTile, TeamCard, GalleryTile, FileRow, StandingsTable, FormDots, LineupTable, ScorersList, RoundResults, HeadToHead, WeekendProgram, PhotoGrid, Lightbox, MatchHeader, TeamShell, SeasonSelect, PersonSelect, TeamSelect, Content, SectionList, ContentEditModal) | **24** | vlastní |
| Veřejné obrazovky | **16** | vlastní, ale skládají se z výše uvedeného |
| Správcovské obrazovky | **12** | 7 z nich je jen `CONFIG` objekt |

Proti revizi 5. 9. přibylo: `EmptyState` (prázdné stavy jsou v návrhu povinné, ale komponenta
pro ně chyběla) a trojice `Content`, `SectionList` a `ContentEditModal`, která nahradila
`UiEcc`. Rozsahovou roli v guardu řeší `caio-ui`, ne appka.

Časová osa historie je **`Uu5Bricks.VerticalTimeline`** zaregistrovaná do `uu5String`, aby ji
redakce mohla vkládat do sekce stránky — vlastní komponenta se nepíše.

`WeekendProgram` je sekce na home, ne routa: program víkendu napříč kategoriemi.

## F.2 Kde uu5 nestačí a proč

| Místo | Co chybí | Řešení |
|---|---|---|
| `Uu5Elements.Header` | token pro `font-family` | schválené přebití `className`em na vnitřní `Text` |
| GDS typografie | `fontFamily`, `letterSpacing`, `textTransform` nejsou tokeny | přimíchávají se z `theme.typography[role].style`; **velikost se nikdy nepřepisuje** |
| GDS váhy vs. Bebas Neue | GDS chce u `hero`/`h5` váhu 700, Bebas má jen 400 | `fontWeight: 400` u rolí sázených Bebasem — jinak by prohlížeč tučnost nasyntetizoval |
| Časová osa historie | `uu5g05-elements` ji nemá | `Uu5Bricks.VerticalTimeline` registrovaná do `uu5String` — viz [frontend.md](./frontend.md), 3.11.1. **uu5g04 je zakázané**, vlastní komponenta se nepíše. |
| GDS paleta | `building` je bílá, tmavé schéma se nepřenastaví | barvy lišty a ploch z `theme.js` přes `cssBackground`/`cssColor` |
| Tabulka soutěže | `Uu5Tiles.Table` neumí zvýraznit řádek klubovou barvou ani skrývat sloupce po breakpointech | vlastní `StandingsTable` nad `<table>` |
| Odpočet do zápasu | uu5 nemá | vlastní `Countdown` (`useInterval` + `useVisibility`) |
| Mapa v kontaktu | uu5 nemá mapovou komponentu | `<iframe>` OpenStreetMap — je obsahem sekce stránky `contact`, ne kódu appky |
| Lightbox | `Uu5Elements.Modal` ano, ale bez šipek a swipe | vlastní `Lightbox` nad `Modal` |
| Editace obsahu | ECC modul v `caio-server` není a ladí se zvlášť | článek `content`, stránka `sectionList: [{ content }]`; `Content` + `SectionList` + `ContentEditModal` nad `uu5codekitg01-forms`, **zatím kód místo WYSIWYG** |
| ~~Rozsahová role v guardu~~ | ~~`withRoute` porovnává profily na přesnou shodu~~ | **doplněno do `caio-ui` 2026-09-06**: `"teamEditor:*"` + `UiAuth.getScopeList()` |
| Soubory ke stažení | `UiElements.BinaryCrud` je záměrně nerozšiřitelná přes props | vlastní `Crud` konfigurace nad `BinaryProvider` s `category` a `date` |
| Prázdné stavy | uu5 nemá jednotný „žádná data" | vlastní `EmptyState` |
| Ikony | GDS sada má 192 ikon a **nemá** `location`, `mail`, `time`, `trophy`, `user`, `users`, `list`, `chart` | správné názvy jsou `mapmarker`, `email`, `clock`, `favorites`, `account`, `account-multi`, `view-list`. Neexistující ikona se **tiše vykreslí jako prázdné místo**, takže si jí nikdo nevšimne — ověřovat v prohlížeči, ne odhadem. |

## F.3 Co je vědomě holé HTML

`<section>`, `<h1>`–`<h3>`, `<table>` ve `StandingsTable` a `<iframe>` mapy. Vždy kvůli
sémantice, přístupnosti a SEO — ne kvůli stylu. Všechno ostatní jde přes uu5.
