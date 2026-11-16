# Uu5Elements menu: na mobilu nejde psát do SearchButton schovaného v menu (uu5g05-elements 1.52.2, 1.53.0 i 1.54.0-alpha-react19.3)

Podklad pro nahlášení do uu5 SLS. Nalezeno 2026-11-16 v administraci afkbratcice: na
mobilu nejde vyhledávat v seznamech osob ani hráčů. Pole „Hledat…“ dostane fokus, ale
písmena se do něj nezapíšou. V aplikaci zatím obejité není.

## Prostředí

| | |
| --- | --- |
| Knihovny | `uu5g05` + `uu5g05-elements` + `uu5g05-forms` **1.54.0-alpha-react19.3** s Reactem 19.1.9 (ověřeno i na 1.53.0 a 1.52.2 s Reactem 18.3.1), `uu5tilesg02` + `uu5tilesg02-controls` 2.29.0 |
| Komponenty | `Uu5TilesControls.SearchButton` v `actionList` bloku `Uu5Elements.Block`; na úzké obrazovce ho `ActionGroup` schová do menu „⋮“ (`displayType: "menu-item"`) |
| Prohlížeč | Chromium, emulace mobilu 375×812 (`isMobileOrTablet === true`), skutečné stisky kláves (CDP `Input.dispatchKeyEvent`) |
| Na reálném telefonu | nahlášeno uživatelem (osoby i hráči); typ telefonu jsme neověřovali |

## Reprodukce

Minimální kompozice (stejná jako v aplikaci):

```jsx
<Uu5Tiles.ControllerProvider data={data} serieList={[{ value: "name", label: "Jméno" }]}>
  <Uu5Elements.Block
    header="Osoby"
    actionList={[
      { component: <Uu5TilesControls.SearchButton /> },
      { component: <Uu5TilesControls.FilterButton type="bar" /> },
      { component: <Uu5TilesControls.SerieButton /> },
      { icon: "uugds-plus", children: "Vytvořit", primary: true },
    ]}
  >
    <Uu5TilesControls.FilterBar />
    <Uu5TilesElements.List columnList={[{ value: "name" }]} />
  </Uu5Elements.Block>
</Uu5Tiles.ControllerProvider>
```

1. Otevřít na mobilu (nebo v emulaci mobilního zařízení, šířka 375 px).
2. Klepnout na „⋮“ v hlavičce bloku. Menu se otevře jako spodní panel a první položka je
   pole „Hledat…“.
3. Klepnout do pole a psát na klávesnici, např. „balv“.

**Očekávané:** text se zapíše do pole a po potvrzení se seznam vyfiltruje.

**Skutečné:** pole má fokus (`document.activeElement` je ten `input`), ale zůstane prázdné.
Písmena se nezapíšou; mezera a Backspace fungují. Text vložený mimo `keydown` (vložení ze
schránky, CDP `Input.insertText`) se zapíše, takže je vidět, že vadí právě obsluha kláves.

## Příčina

`dist/uu5g05-elements.js`, modul `./_menu-list/menu-list-body.js`, `onKeyDown`
(1.53.0, ř. ~16656):

```js
function onKeyDown(e) {
  if (e.currentTarget?.contains(e.target)) {
    ...
    let currentFocusIndex = lastFocusedItemKeyRef.current;
    // not checking whether focus is inside of one of menu items because menu item can contain input
    // (e.g tiles SearchButton collapsed inside of ActionGroup) and we don't want to proces keys in such case
    if (currentFocusIndex === -1) return;
    ...
    default: {
      // check for key with length === 1, optionally using Shift
      if (/^(Shift\+)?.$/.test(keyWithModifiers) && e.key !== " ") {
        // type-ahead: skok na položku podle prvního písmene
        ...
        break;
      } else keyProcessed = false;
    }
    ...
    if (keyProcessed && e.key !== "Tab") {
      e.preventDefault(); // because of scrolling whole window
      e.stopPropagation();
    }
```

Menu u každé jednoznakové klávesy (kromě mezery) dělá type-ahead a zavolá
`preventDefault()`. Tím se znak do pole uvnitř položky nezapíše. Knihovna s tímto případem
počítá (komentář výše přímo jmenuje sbalený tiles `SearchButton`), pojistkou je ale jen
`currentFocusIndex === -1`.

`lastFocusedItemKeyRef` počítá `./_internal/use-focus-list.js` (ř. ~14951) z
`mouseOverItemKey` / `keyboardItemKey`. Na mobilu se ale sledování myši vypíná:

```js
function onMouseOver(e) {
  if (isMobileOrTablet) return;
  ...
}
```

(stejně `onMouseLeave` a další). Index tedy na mobilu nikdy není `-1`, pojistka nezabere a
písmena končí v type-ahead. Zachycený zásobník volání `preventDefault` pro `keydown` „n“ vede
právě sem (`onKeyDown` v `menu-list-body.js`).

Že by se vada projevila i na počítači v úzkém okně (kde `isMobileOrTablet` je `false`), jsme
neověřovali.

Poznámka k Androidu: virtuální klávesnice s IME často posílají `keydown` s
`key: "Unidentified"` (keyCode 229). Ten regex nesplní a projde, takže se vada na některých
telefonech nemusí projevit. Na iOS a s hardwarovou klávesnicí přichází skutečný znak a
projeví se. Na reálných zařízeních jsme to neověřovali.

## Návrh opravy

V `onKeyDown` nedělat type-ahead (ani jinou obsluhu znaků), když událost vznikla v
editovatelném prvku:

```js
const t = e.target;
const isEditable = t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || t?.isContentEditable;
if (isEditable && /^(Shift\+)?.$/.test(keyWithModifiers)) return;
```

Knihovna podobnou kontrolu už má o kus výš ve `focusItem` (`activeEl.tagName === "INPUT" ||
"TEXTAREA" || isContentEditable` u `origin === "mouse"`), jen ne v obsluze kláves.
Případně pojistku `currentFocusIndex === -1` nahradit kontrolou `e.target` uvnitř položky s
`component`.

## Dopad v aplikaci

- Administrace, seznamy přes caio-ui `UiElements.Crud` / `ListBlock`: **Osoby** a **Hráči**
  (soupisky i karty) ověřeno; stejně se chovají všechny další seznamy, které mají
  `SearchButton` v liště bloku.
- Na mobilu tak nejde hledat v žádném seznamu administrace.

## Možná obejití (zatím neprovedeno)

- V caio-ui `ListBlock` nedávat `SearchButton` na mobilu do sbalitelných akcí (nechat ho v
  liště jako ikonu, která se rozbalí na pole mimo menu), nebo hledání na mobilu vykreslit jako
  samostatné pole nad seznamem.
- Na `keydown` uvnitř pole zastavit propagaci dřív, než dojde k `MenuList` (handler na
  `input`, `e.stopPropagation()` pro jednoznakové klávesy). Křehké, závisí na pořadí
  React handlerů.
