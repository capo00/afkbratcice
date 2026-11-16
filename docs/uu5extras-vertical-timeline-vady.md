# Uu5Extras.VerticalTimeline: dvě vady vzhledu (uu5extrasg01 1.9.0)

Podklad pro nahlášení do uu5 SLS. Nalezeno při přechodu stránky `/historie` z
`Uu5Bricks.VerticalTimeline` na `Uu5Extras.VerticalTimeline` (review 2026-11-12, S5).
V aplikaci jsou obě vady obejité CSS s `!important` v `client/src/routes/page.jsx`;
po opravě v knihovně se obejití smaže.

## Prostředí

| | |
| --- | --- |
| Knihovna | `uu5extrasg01` 1.9.0 (npm), `uu5g05` + `uu5g05-elements` z téže sady |
| Komponenta | `Uu5Extras.VerticalTimeline`, vnitřně `_internal/vertical-timeline/vertical-timeline-item.js` |
| Použití | uu5String: `<Uu5Extras.VerticalTimeline singleColumn animation='<uu5json/>false' itemLabelSize="m" itemList='<uu5json/>[…]'/>` |
| Prohlížeč | Chromium (Claude desktop / Chrome), desktop 1280 px i mobil 375 px |

## Vada 1: kolečko ikony má napevno bílé pozadí

**Kde:** `dist/uu5extrasg01.js`, komponenta `VerticalTimelineItem`, render:

```js
iconStyle: {
  boxShadow: "none",
  background: "white"
},
```

`iconStyle` jde jako inline `style` na `.vertical-timeline-element-icon`, takže
vyhraje nad vším z `Css.icon(...)` i nad tématem. Barva kolečka nebere v úvahu
`useBackground()` ani `colorScheme` / `significance` položky, přestože je komponenta
o pár řádků výš počítá (`getShapeStyles` → `iconStyles`) a dává je samotné ikoně.

**Reprodukce:**
1. Stránka s tmavým pozadím (uu5 `BackgroundProvider background="dark"`, nebo aplikace
   v tmavém režimu, kde podklad stránky je tmavý).
2. `itemList` s položkou bez `colorScheme` (nebo `significance: "subdued"`), např.
   `{ "label": "1932", "icon": "uugds-calendar", "children": "Text" }`.

**Očekávané:** kolečko ikony má barvu odpovídající pozadí a stylu položky, ikona je
čitelná.

**Skutečné:** kolečko je bílé. Ikona má barvu z GDS pro tmavé pozadí (světlou,
poloprůhlednou), takže na bílém kolečku prakticky zmizí. Na světlém pozadí je vada
neviditelná, proto ji demo nejspíš neodhalí.

**Návrh opravy:** `background: "white"` z `iconStyle` odstranit a barvu kolečka
nechat na `iconStyles` (případně barva pozadí podle `useBackground()`, aby kolečko
dál zakrývalo čáru osy, která pod ním vede).

**Obejití v aplikaci:**

```js
"& .vertical-timeline-element-icon": { backgroundColor: `${theme.color.bg} !important` },
```

## Vada 2: popisek (label) obtéká text položky v režimu `singleColumn`

**Kde:** vložené CSS z `react-vertical-timeline-component` v chunku
`_internal_vertical-timeline_react-vertical-timeline-item_js-*.js`:

```css
.vertical-timeline-element-content .vertical-timeline-element-date {
  float: left;
  padding: .8em 0;
  opacity: .7;
}
```

`Css.label(...)` v `vertical-timeline-item.js` v režimu `singleColumn` přidá jen
typografii (`dynamicStyles` se nastavují jen pro `!singleColumn`), `float` nepřebije.
Ve dvousloupcovém režimu na širokém displeji je popisek `position: absolute` vedle osy
a vada se neprojeví; v `singleColumn` (a pod 1170 px, kdy se dvousloupcový režim
skládá do jednoho) ano.

**Reprodukce:**
1. `singleColumn`, `itemLabelSize="m"`.
2. Položka s textem na dva a více řádků, jehož poslední řádek je krátký.

**Očekávané:** popisek (rok) je pod textem zarovnaný vlevo, na samostatném řádku.

**Skutečné:** popisek je `float: left` za textem; poslední, krátký řádek textu ho
obtéká, takže se popisek odsune doprava vedle něj nebo se text zalomí kolem něj. Výška
položky pak závisí na délce posledního řádku.

**Návrh opravy:** v `Css.label` pro `singleColumn` přidat `float: "none", display: "block"`
(případně `clear: both`).

**Obejití v aplikaci:**

```js
"& .vertical-timeline-element-date": { float: "none !important", display: "block !important" },
```

## Související pozorování (ne vada, ale stojí za zmínku v issue)

- `itemList[].children` se vykreslí tak, jak je: vnořený `<uu5string/>` v JSON
  `itemList` se neparsuje a zobrazí se doslova. Text položky proto nemůže mít
  formátování (tučné písmo apod.), pokud se komponenta používá z uu5Stringu. Předchůdce
  `Uu5Bricks.VerticalTimeline` vnořený uu5String uměl.
- Bez `Utils.LibraryRegistry.registerComponent(Uu5Extras.VerticalTimeline)` si uu5g05
  jmenný prostor `Uu5Extras` z uu5Stringu překládá dotazem do uuAppLibraryRegistry na
  `uuapp.plus4u.net`. Pro aplikaci mimo Plus4U to znamená požadavek na cizí server
  u každého návštěvníka; dokumentace to nezmiňuje.
