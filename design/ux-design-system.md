# UX design system — vytěženo z předlohy

Datum: 2026-09-05

Zdroj: Lovable prototyp „AFK Bratčice Hub“
(`id-preview--8466e9ad-8256-45ed-84e1-9bf99ab8cb75.lovable.app`), screenshoty v
[`mockups/`](./mockups/).

Hodnoty níže jsou **odečtené z běžící stránky** (computed style), ne odhad z obrázku.

Předloha je Tailwind/shadcn appka. **Nepřebíráme ji jako kód** — přepisujeme ji do `uu5g05`
komponent (viz [README.md](./README.md), sekce 2, rozhodnutí *Implementace*). Tenhle dokument je
překladový klíč: co má nová appka vizuálně splnit a jakou uu5 komponentou se to dělá.

---

## 0. Mockupy

| Soubor | Obsah |
|---|---|
| `mockups/desktop-01-home.jpg` | Úvodní stránka, celá (1536 px) |
| `mockups/desktop-02-historie.jpg` | Historie klubu |
| `mockups/desktop-03-muzstva.jpg` | Přehled mužstev |
| `mockups/desktop-04-fotogalerie.jpg` | Fotogalerie s filtrem |
| `mockups/desktop-05-kontakt.jpg` | Kontakt a výbor |
| `mockups/desktop-06-fotogalerie-lightbox.jpg` | Lightbox nad fotkou |
| `mockups/mobile-01-home.jpg` … `mobile-05-kontakt.jpg` | Totéž na 390 px |
| `mockups/mobile-06-menu.jpg` | Rozbalené mobilní menu |

Screenshoty jsou pořízené na viewportech **1536 × 674** (desktop) a **390 × 674** (mobil) a
posklá­dané do celostránkových obrázků.

**Rozsah předlohy je menší než rozsah v2.** Prototyp má pět rout (`/`, `/historie`, `/muzstva`,
`/fotogalerie`, `/kontakt`), obsah je natvrdo a bez přihlašování. Detail mužstva je v předloze
prolinkovaný (`/muzstva/muzi`), ale **nevykresluje se** — routa spadne zpět na přehled mužstev.
Detail zápasu, profil hráče, detail článku, soubory ke stažení ani správcovská část v předloze
nejsou vůbec. Předloha tedy určuje **vzhled a tón**, ne rozsah — ten drží
[README.md](./README.md) a [frontend.md](./frontend.md).

---

## 1. Barvy

Předloha je **tmavá** (dark-only) a jede v `oklch`. Ukládám obojí — `oklch` je zdroj pravdy,
hex je bezpečný fallback pro místa, kde `uu5g05` `oklch` nezvládne.

| Token | oklch | hex | Kde se používá |
|---|---|---|---|
| `background` | `oklch(11.5% .006 25)` | `#070404` | základní podklad stránky (skoro černá, teple posunutá) |
| `card` | `oklch(16.5% .009 25)` | `#120D0C` | podklad karet (zápas, článek, hráč) |
| `secondary` / `muted` | `oklch(21% .01 25)` | `#1D1716` | jemné plochy, neaktivní filtr chip |
| `accent` | `oklch(24% .025 27)` | `#2A1B19` | zvýrazněný řádek tabulky (vlastní tým) |
| `border` | `oklch(27% .012 25)` | `#2C2423` | rámečky karet, oddělovače |
| `input` | `oklch(31% .012 25)` | `#362E2D` | rámeček vstupu |
| `foreground` | `oklch(95.5% .005 60)` | `#F3EFED` | základní text |
| `mutedForeground` | `oklch(66% .012 30)` | `#99908E` | sekundární text, perex, popisky |
| **`primary` / `clubRed`** | `oklch(40% .164 29.23)` | **`#8b0000`** | klubová červená (rudá): CTA, eyebrow, aktivní nav, skóre |
| `clubRedBright` | `oklch(63% .24 28)` | `#F92725` | světlejší varianta (hover, CTA pruh) — zatím se nikde nepoužívá |
| `primaryForeground` | `oklch(98% .01 60)` | `#FEF7F2` | text na červené |
| `destructive` | `oklch(57.7% .245 27.325)` | `#E7000B` | chyby |

**Pravidlo, které drží celý vzhled:** nikde není čistá černá ani čistá bílá. Všechno je posunuté
do teplé (hue 25–30). Když se v implementaci objeví `#000000` nebo `#FFFFFF`, je to chyba.

> **Změna 7. 9. 2026: klubová barva je tmavší rudá `#8b0000`** (dřív `#D01319`). Je to
> rozhodnutí o značce a platí. Má ale jeden důsledek, se kterým se musí počítat: na
> podkladu `bg` (`#070404`) dává rudá kontrast **2,0 : 1** (dřív 3,6 : 1), takže **jako text
> na tmavém pozadí je pod hranicí čitelnosti** — týká se skóre, eyebrow, ikon a zvýrazněného
> vlastního týmu v tabulce. Jako **plocha** (CTA pruh, proužek karty, forma W) je v pořádku:
> `onRed` na ní má 9,6 : 1. Až se to začne řešit, cesta je světlejší odstín pro text
> (`clubRedBright` už v tokenech je a nikde se nepoužívá), ne návrat značky.

Rytmus stránky: sekce se střídají `background` → `background` s **diagonálním šrafováním**
(velmi jemný opakovaný pruh v `card`/`secondary`) a jednou za stránku to přeruší **plný červený
CTA blok** („Chceš si zahrát za Bratčice?“) — ten dělá vizuální těžiště, stejnou roli jako
`forest` blok u propertymanu.

### Klubové logo

Erb je černo-červený trojúhelník s míčem a letopočtem 1932. Bere se z `client/src/assets`
(v1 má `AFK_erb_light_*`) a stejný motiv jde i do PWA ikon a favicony
(viz [frontend.md](./frontend.md), sekce 9).

---

## 2. Typografie

Dvojice z Google Fonts:

| Role | Font | Fallback |
|---|---|---|
| Display (nadpisy, čísla, tlačítka) | **Bebas Neue** | `Impact, Haettenschweiler, sans-serif` |
| Body / UI | **Barlow** | `system-ui, sans-serif` |

Bebas Neue je úzký velkopísmenný grotesk — sportovní, „dresový“ charakter celé předlohy stojí
na něm. Barlow je nízkokontrastní grotesk, drží text klidný.

### 2.1 Pravidlo: velikosti písma vždy z uuGds

**Žádná velikost písma se nepíše číslem.** Každý stupeň sazby je token z GDS a bere se přes
`Uu5Elements.Text` s `category` / `segment` / `type`; komponenta spočítá `fontSize`,
`lineHeight` i `fontWeight` a předá je jako `style`.

```jsx
<Uu5Elements.Text category="expose" segment="default" type="hero">
  {({ style }) => <h1 className={Config.Css.css({ ...style, ...theme.text.h1 })}>…</h1>}
</Uu5Elements.Text>
```

Dvě věci to řeší zadarmo:

- **Mobilní stupně.** GDS má vlastní sadu `smallScreen` a `Typography` si mezi nimi vybírá
  sama. Proto v `theme.js` **není žádné `textMobile`** — kdyby tam bylo, přebilo by GDS.
- **Konzistenci s uu5 komponentami.** Text uvnitř `Tile`, `Button` nebo `Table` sází GDS;
  kdybychom si vedle toho drželi vlastní škálu, web by měl dvě různé sazby.

Co GDS nemá a co si tedy `theme.js` drží dál: **`fontFamily`, `letterSpacing`,
`textTransform`**. Tyhle tři vlastnosti se k GDS stylu přimíchávají, velikost se nikdy nepřepisuje.

### 2.2 Mapování rolí na GDS tokeny

Ověřeno proti `uu_gdsg01-unicorn` (`dist/uu_gdsg01-unicorn-source.json`), 2026-09-05.

| Role | GDS token | large | small | Co přidáváme z `theme.js` |
|---|---|---|---|---|
| `h1` (hero) | `expose` / `default` / `hero` | 44/52 w700 | 32/38 w700 | Bebas, `ls .04em`, `uppercase` |
| `h2` (nadpis sekce) | `interface` / `title` / `main` | 32/36 w500 | 24/28 w500 | Bebas, `ls .04em`, `uppercase` |
| `h3` (nadpis karty) | `story` / `heading` / `h5` | 18/22 w700 | 17/20 w700 | Barlow (dědí se) |
| `h4` (podnadpis, řádek tabulky) | `interface` / `title` / `minor` | 18/20 w500 | 18/20 w500 | – |
| body | `interface` / `content` / `large` | 16/22 w400 | 16/22 w400 | – |
| perex, popisek | `interface` / `content` / `medium` | 14/20 w400 | 14/20 w400 | barva `mutedFg` |
| skóre, velká čísla statistik | `expose` / `default` / `lead` | 34/40 w700 | 28/34 w700 | Bebas |
| tlačítko | `interface` / `interactive` / `medium` | 14/16 w500 | 14/16 w500 | `ls .1em`, `uppercase` (řeší `Uu5Elements.Button` sám) |
| **eyebrow** | `interface` / `highlight` / `small` | 12/14 w400 ls .5 | 12/14 | Barlow, **w700**, `ls .25em`, `uppercase`, barva `clubRed` |
| popisek fotky | `story` / `special` / `caption` | 12/16 w400 | 13/16 w400 | barva `mutedFg` |

### 2.3 Co to znamená proti předloze

Předloha má hero **96/96** a nadpis sekce **48/48**; strop GDS je **44/52**, resp. 32/36.
Nadpisy tedy budou o poznání menší, než jsou na mockupech — a protože Bebas Neue je úzký
display font, 44 px Bebas působí opticky menší než 44 px Barlow. Hero ztratí část důrazu.

Je to **vědomá cena za jednotnou sazbu**, a **potvrzená** (rozhodnuto 2026-09-06,
[README.md](./README.md), §9.8): `theme.js` nemá žádné číslo velikosti a pravidlo platí
bez výjimky, včetně hero. Lámat ho hned na první obrazovce by z něj udělalo doporučení.

Důraz hero tedy musí přijít odjinud než z velikosti písma: fotka přes celou šířku
s tmavým překryvem, erb, červený eyebrow nad nadpisem, prostrkání a dvě CTA tlačítka.
Jestli se po implementaci ukáže, že to nestačí, je přebití `scale` nad GDS hodnotou
změna, která patří do `decisions.md` se zdůvodněním — ne tichý přepis v komponentě.

Prostrkání zůstává **kladné** (+4 %), na rozdíl od propertymanu, kde je záporné.
Bebas Neue bez prostrkání „slepí“.

**Eyebrow** je malý prostrkaný červený štítek nad každým nadpisem sekce — `PROGRAM`,
`KOLO ZA KOLEM`, `NOVINKY Z KLUBU`, `SOUTĚŽE`, `OD ROKU 1932`, `JEDEN KLUB, JEDNY BARVY`,
`KLUB V OBRAZECH`, `SPOJTE SE S NÁMI`. Barva `clubRed`. Nadpis sekce má navíc **červený svislý
pruh vlevo** (4 px). Obojí je nejlevnější a nejvýraznější prvek rytmu celé stránky —
nevynechávat.

---

## 3. Rozměry a rytmus

| Věc | Hodnota |
|---|---|
| Šířka obsahu | `max-width: 1152 px`, vycentrováno |
| Boční padding sekce | 16 px (`xs`) → 24 px (`sm` a výš) |
| Vertikální padding sekce | 64 px |
| Výška horní lišty | **65 px** (64 + 1 px spodní border) |
| `radius` | `0.5rem` (8 px); karty vypadají na 8–12 px |
| Rámeček karty | 1 px `border`, podklad `card`, bez stínu |
| Karta zápasu | horní **červený proužek 3 px** jako akcent |
| Mřížka | 3 sloupce (zápasy, výsledky, aktuality, mužstva, galerie), 1 sloupec na `xs` |

Stíny se prakticky nepoužívají — plochy odděluje barva a 1px rámeček, ne elevace. Jedinou
výjimkou je stín horní lišty po dosednutí (ten přidává `Top` z `caio-ui` sám).

---

## 4. Sekce a obrazovky předlohy

### 4.1 Horní lišta (všechny stránky)

Sticky, tmavá (`background` s 90% průhledností + blur), spodní 1px border. Vlevo erb + dvouřádkový
název (`AFK BRATČICE` / `OD ROKU 1932` — druhý řádek je eyebrow). Vpravo vodorovné menu; aktivní
položka je **červená pilulka**. Na mobilu se menu sbalí do hamburgeru a rozbalí jako svislý
seznam přes celou šířku (`mockups/mobile-06-menu.jpg`).

### 4.2 Home (`mockups/desktop-01-home.jpg`)

| # | Blok | Obsah |
|---|---|---|
| 1 | **Hero** | fullbleed foto hráčů, tmavý overlay, erb, `h1` „AFK BRATČICE“, prostrkaný červený podtitul, perex, dvě tlačítka (plné červené + outline) |
| 2 | **Statistiky** | 3 dlaždice přes hero: ikona, velké číslo (Bebas), popisek — `1932 ZALOŽENO`, `3 MUŽSTVA`, `90+ LET TRADICE` |
| 3 | **Nejbližší zápasy** | 3 karty (A-tým / Mládež / Veteráni): štítek kategorie, soutěž + kolo, `domácí — VS — hosté`, oddělovač, datum + čas s ikonami, tlačítko *Detail mužstva* |
| 4 | **Poslední výsledky** | 3 kompaktní karty: štítek, datum, soutěž, dvojice týmů, **skóre v tmavém chipu** a výsledkový odznak (`VÝHRA` červený, `REMÍZA` šedý) |
| 5 | **Aktuality** | 3 karty: foto s kategorií v červené pilulce, datum, titulek, perex |
| 6 | **Tabulky** | přepínač `MUŽI` / `ŽÁCI` (segmentované tlačítko), tabulka `# / TÝM / Z / V / R / P / SKÓRE / BODY`, vlastní tým zvýrazněný červeně; pod tabulkou poznámka, že stará garda tabulku nemá |
| 7 | **CTA pruh** | plná červená plocha, `h2` „CHCEŠ SI ZAHRÁT ZA BRATČICE?“, perex, tmavé tlačítko *Kontaktujte nás* |
| 8 | **Footer** | 3 sloupce (značka + popis, Navigace, Kontakt s ikonami), spodní řádek: copyright vlevo, `SRDCEM ZA BRATČICE` červeně vpravo |

### 4.3 Historie (`mockups/desktop-02-historie.jpg`)

Eyebrow + `h2`, dvousloupcový úvodní text, dvě fotky s popiskem v patičce rámečku, pak
**časová osa** „Milníky klubu“ — svislá linka, červené tečky, rok velkým Bebas červeně,
podnadpis a odstavec. Milníky: 1932, 1948, 1972, 1992, 2005, 2012, 2022.

### 4.4 Mužstva (`mockups/desktop-03-muzstva.jpg`)

3 karty: týmová fotka s odznakem kategorie (`A-TÝM` / `MLÁDEŽ` / `VETERÁNI`), název Bebas,
perex, tři řádky s ikonami (soutěž, trenér, tréninky) a plné červené tlačítko *Detail mužstva*.

### 4.5 Fotogalerie (`mockups/desktop-04-fotogalerie.jpg`)

Řada filtrovacích chipů (`VŠE`, `ZÁPASY`, `TRÉNINK`, `FANOUŠCI`, `MLÁDEŽ`, `KLUB`) — aktivní
červeně. Pod tím mřížka 3 × n fotek; na fotce dole popisek a kategorie červeně. Klik otevře
**lightbox** (`desktop-06`): tmavé zatmavení, fotka na střed, popisek pod ní, křížek vpravo
nahoře.

### 4.6 Kontakt (`mockups/desktop-05-kontakt.jpg`)

Vlevo karta s adresou, e-mailem a telefonem (ikona + štítek + hodnota) a pod ní **mapa**
(OpenStreetMap). Vpravo `VÝBOR AFK` — mřížka 2 × n karet: role prostrkaně červeně, jméno,
volitelně e-mail a telefon. Pod tím karta s výzvou ke spolupráci.

---

## 5. Překlad do uu5 — co čím

Pravidlo: **veškerá implementace jde přes `uu5g05` a `caio-ui`.** Vzhled se ladí **propsy**
komponent, ne přestylováním. `className` nad uu5 komponentou je poslední možnost — a jen tam,
kde komponenta prop nemá; každý takový případ patří do `docs/decisions.md` appky
i s důvodem (stejná konvence jako v `caio_propertyman`, `docs/component-tree.md`).

| Prvek předlohy | uu5 řešení |
|---|---|
| Horní lišta | `UiApp.Spa` prop `top` — `logo`, `children` (`Uu5Elements.Header` s názvem a podtitulem), `menu.itemList`, `cssBackground`/`cssColor` z `theme`. `Top` se **neimportuje**, není exportovaný. |
| Sbalení menu na mobilu | řeší `Uu5Elements.ActionGroup` uvnitř `Top` sám. Nic se nenastavuje. |
| Aktivní položka menu | `significance: "highlighted"` + `colorScheme` na položce `itemList` |
| Patička | vlastní komponenta předaná do `UiApp.Spa` prop `footer` |
| Sekce s max šířkou a paddingem | vlastní `components/layout/section.jsx` nad `Uu5Elements.Block`; `main={{ padding: false }}`, sekce si gutter řeší samy |
| Eyebrow + `h2` s červeným pruhem | vlastní `components/layout/heading.jsx` nad `Uu5Elements.Text` s tokeny z `config/theme.js` |
| Karta (zápas, článek, hráč, člen výboru) | `Uu5Elements.Tile` nebo `Uu5Elements.Block` s `card`/`border` tokeny |
| Mřížka 3/1 sloupce | `Uu5Elements.Grid` s `templateColumns={{ xs: "1fr", m: "repeat(3, 1fr)" }}` |
| Odznak kategorie, výsledkový odznak | `Uu5Elements.Badge` / `Uu5Elements.Tag` |
| Tlačítka | `Uu5Elements.Button` (`significance` `highlighted`/`common`, `colorScheme`) |
| Přepínač `MUŽI`/`ŽÁCI`, filtr galerie | `Uu5Elements.Tabs` nebo `Uu5Forms.SwitchSelect` |
| Tabulka soutěže | `uu5tilesg02` `Table` přes `UiElements.Crud` v `readOnly` režimu, nebo přímo `Uu5Tiles.Table` |
| Časová osa historie | obsahová stránka `page?code=history` — osa je `Uu5Bricks.VerticalTimeline` uvnitř `content` jedné sekce (`uu5String`), ne natvrdo psaná komponenta |
| Lightbox fotogalerie | `Uu5Elements.Modal` + `UiElements.Image` |
| Mapa | `<iframe>` OpenStreetMap uvnitř `Uu5Elements.Block` (uu5 vlastní mapovou komponentu nemá) |
| Ikony | `Uu5Elements.Icon` s `uugds-*` / `uugdsstencil-*` sadou |
| Rozestupy | `Uu5Elements.SpacingProvider type="loose"` kolem celé appky (web, ne aplikace) |
| Skeletony místo spinnerů | `Uu5Elements.Skeleton` |

### `client/src/config/theme.js`

**Jediné místo, kde smí být hexy a velikosti písma.** Komponenty berou vždy odsud; když se v JSX
objeví `"#..."` nebo `fontSize: 48`, je to chyba. Tvar převzatý z `caio_propertyman`:

```js
const color = {
  bg: "#070404",
  card: "#120D0C",
  surface: "#1D1716",   // secondary / muted
  accent: "#2A1B19",    // zvýrazněný řádek tabulky
  border: "#2C2423",
  input: "#362E2D",
  fg: "#F3EFED",
  mutedFg: "#99908E",
  clubRed: "#8b0000",
  clubRedBright: "#F92725",
  onRed: "#FEF7F2",
};

const font = {
  display: '"Bebas Neue", Impact, Haettenschweiler, sans-serif',
  body: '"Barlow", system-ui, sans-serif',
};

// ŽÁDNÁ velikost písma. Stupně sazby dává GDS přes Uu5Elements.Text (viz sekce 2.1);
// tady jsou jen vlastnosti, které GDS nemá. Když se sem dostane `fontSize`, je to chyba.
const typography = {
  // fontWeight: 400 -- Bebas Neue má jen jednu váhu, GDS by chtěl 700 a prohlížeč
  // by ji nasyntetizoval (viz sekce 6).
  h1: { token: ["expose", "default", "hero"], style: { fontFamily: font.display, fontWeight: 400, letterSpacing: "0.04em", textTransform: "uppercase" } },
  h2: { token: ["interface", "title", "main"], style: { fontFamily: font.display, fontWeight: 400, letterSpacing: "0.04em", textTransform: "uppercase" } },
  h3: { token: ["story", "heading", "h5"], style: {} },
  h4: { token: ["interface", "title", "minor"], style: {} },
  body: { token: ["interface", "content", "large"], style: {} },
  perex: { token: ["interface", "content", "medium"], style: { color: color.mutedFg } },
  score: { token: ["expose", "default", "lead"], style: { fontFamily: font.display, fontWeight: 400 } },
  eyebrow: { token: ["interface", "highlight", "small"], style: { fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: color.clubRed } },
  caption: { token: ["story", "special", "caption"], style: { color: color.mutedFg } },
};

export default {
  color, font, typography,
  radius: 8,
  maxWidth: 1152,
  gutter: { xs: 16, s: 24 },
  sectionPad: 64,
  topHeight: 64,
};
```

`Heading` a `Eyebrow` z toho udělají jeden idiom (převzato z `caio_propertyman`
`components/layout/heading.jsx`):

```jsx
const { token, style: own } = theme.typography[role];
const [category, segment, type] = token;

<Uu5Elements.Text category={category} segment={segment} type={type}>
  {({ style }) => <Tag className={Config.Css.css({ ...style, ...own, margin: 0 })}>{children}</Tag>}
</Uu5Elements.Text>
```

`children` jako funkce je pro tohle přímo určená cesta: `Text` spočítá typografii, ale
renderování nechá na nás — takže z toho je skutečné `<h2>`, ne `<span>`, a osnova dokumentu
zůstane v pořádku.

Klubovou červenou je navíc potřeba nastavit jako GDS význam, aby ji `Uu5Elements` komponenty
braly bez explicitních barev:

```js
Uu5Elements.UuGds.setMeaningColor("primary", "#8b0000");
```

(v1 to dělá se svým `#8b0000`; nová hodnota je z předlohy.)

---

## 6. Pasti při přepisu do uu5

- **`oklch` v `uu5g05` stylech.** Chrome 111+ to umí, ale pokud barvu protáhne nějaká uu5
  utilita, která ji parsuje, spadne to na neznámém formátu. Proto je v tabulce hex fallback —
  začít hexy, `oklch` až po ověření.
- **Fonty se musí načíst.** Bebas Neue ani Barlow nejsou systémové. Buď `<link>` na Google Fonts
  v `client/index.html`, nebo (lepší pro GAE a offline) `.woff2` do
  `client/public/assets/fonts/` a `@font-face` (propertyman má na to `client/src/fonts.css`).
  Bez toho spadne sazba na Impact/system-ui a vzhled se rozpadne.
- **Bebas Neue má jen jednu váhu (400), ale GDS předepisuje 700.** `expose/default/hero`
  i `story/heading/h5` mají `fontWeight: 700`. Prohlížeč by ji u Bebas nasyntetizoval
  a písmo by se rozmazalo. Role sázené Bebasem proto **musí** v `theme.typography[*].style`
  přebít `fontWeight: 400` — je to jediné povolené přebití GDS hodnoty a je to důsledek
  volby fontu, ne odchylka od pravidla ze sekce 2.1.
- **`textTransform: uppercase` a kladné prostrkání** se snadno zapomenou, protože nadpis se
  často bere přes hotovou uu5 komponentu s vlastní sazbou. Zkontrolovat.
- **`Uu5Elements.Header` nemá token pro font.** Title i subtitle renderuje jako
  `Uu5Elements.Text` s vlastní explicitní `font-family`, takže zdědění nestačí — propertyman to
  řeší cílenou třídou na `[data-name="Uu5Elements.Text"]`
  (`caio_propertyman/client/src/app.jsx`). Stejný postup, stejný důvod, a patří to do
  `decisions.md`.
- **GDS paleta je světlá.** Předloha je dark-only; barvy lišty a ploch se drží tokenů z
  `theme.js` přes `cssBackground`/`cssColor`, ne přes `colorScheme` (paleta `building` je bílá
  a přenastavit se nedá).
- **Fotky v předloze jsou generované.** Reálná data (loga soupeřů, týmové fotky, portréty)
  přijdou z migrace a z `BinaryStore`; layout s tím musí počítat — poměry stran nejsou zaručené,
  karta potřebuje pevný poměr a `object-fit: cover`.
