# Lena Visage

## Přehled

Modul `caio-lenavisage` v rámci `afkbratcice`. Slouží k evidenci objednávek kadeřnického salonu.

- **Autentizace**: vlastní kolekce `caioLenaVisage_identity`, oddělená cookie `token_caioLenaVisage_identity`
- **Vstup**: `/caio-lenavisage` (samostatné SPA)

## Služby

* **Vlasy** (hair)
    * Žena: střih, péče, melíry, přeliv, barva, duo melíry, duo barva, bond ultim
        * Délka vlasů: krátké / střední / dlouhé (ovlivňuje cenu)
        * Materiál (odměrky): melíry 30ml, přeliv 15ml, barva 15ml, duo melíry 30ml, duo barva 15ml, bond ultim 4ml
    * Dítě: střih, péče (krátké / dlouhé)
    * Muž: střih, péče (bez délky)
* **Řasy** (eyelash): nové, doplnění
* **Společenská akce** (event): účes, líčení
* **Svatba** (wedding)
    * Nevěsta: balíček, účes + líčení, účes, účes + zkouška, líčení, líčení + zkouška
    * Host: účes, úprava vlasů, líčení
    * Cesta: per km

## Mongo collections

### `caioLenaVisage_product` (ceníky - 4 dokumenty)

```
Product
  id, sys
  type: "hair" | "wedding" | "event" | "eyelash"

  // type=hair
  woman
    name: "Žena"
    cut:  { name, price: { short, middle, long } }
    care: { name, price: { short, middle, long } }
    melodies:    { name, price: { short, middle, long }, unit: { volume, price } }
    hairSpray:   { name, price: { short, middle, long }, unit: { volume, price } }
    color:       { name, price: { short, middle, long }, unit: { volume, price } }
    duoMelodies: { name, price: { short, middle, long }, unit: { volume, price } }
    duoColor:    { name, price: { short, middle, long }, unit: { volume, price } }
    bondUltim:   { name, unit: { volume, price } }
  child
    name: "Dítě"
    cut:  { name, price: { short, long } }
    care: { name, price }
  man
    name: "Muž"
    cut:  { name, price }
    care: { name, price }

  // type=wedding
  bride
    package:          { name, price }
    hairstyleMakeup:  { name, price }
    hairstyle:        { name, price }
    hairstyleExam:    { name, price }
    makeup:           { name, price }
    makeupExam:       { name, price }
  guest
    hairstyle:    { name, price }
    hairstyleMin: { name, price }
    makeup:       { name, price }
  journey: { name, price, unit }

  // type=eyelash
  new:     { name, price }
  renewal: { name, price }

  // type=event
  hairstyle: { name, price }
  makeup:    { name, price }
```

### `caioLenaVisage_order`

```
Order
  id, sys
  product: "hair" | "wedding" | "event" | "eyelash"
  customerId?
  customerName?
  note?
  subtotal
  total

  // product=hair
  hair?
    category: "woman" | "man" | "child"
    type?: "short" | "middle" | "long"
    services: { <serviceKey>: <price> || { quantity, unit, materialSum, sum } }

  // product=wedding
  wedding?
    time
    bride?: { <serviceKey>: <price> }
    guestList[]?: [ { <serviceKey>: <price>, ... } ]
    deposit?
    depositTime?
    payDate?

  // product=event
  event?: { <serviceKey>: <price>, ... }

  // product=eyelash
  eyelash?: { <serviceKey>: <price> }
```

### `caioLenaVisage_customer`

```
Customer
  id, sys
  name
```

### `caioLenaVisage_identity`

Oddělená kolekce identity pro přihlášení do LenaVisage SPA.

## API endpoints

| Endpoint | Method | Auth | Popis |
|---|---|---|---|
| `caio-lenavisage` | GET | - | Servíruje SPA HTML |
| `caio-lenavisage/product/list` | GET | true | Seznam ceníků (4 dokumenty) |
| `caio-lenavisage/product/get` | GET | true | Ceník dle id |
| `caio-lenavisage/product/create` | POST | authorities | Vytvoření ceníku |
| `caio-lenavisage/product/update` | POST | authorities | Úprava ceníku |
| `caio-lenavisage/product/delete` | POST | authorities | Smazání ceníku |
| `caio-lenavisage/product/seed` | POST | authorities | Seed 4 výchozích ceníků |
| `caio-lenavisage/order/list` | GET | true | Seznam objednávek (filtr: product, year, customerId) |
| `caio-lenavisage/order/listYears` | GET | true | Seznam roků s objednávkami |
| `caio-lenavisage/order/get` | GET | true | Detail objednávky |
| `caio-lenavisage/order/create` | POST | true | Vytvoření objednávky |
| `caio-lenavisage/order/update` | POST | true | Úprava objednávky |
| `caio-lenavisage/order/delete` | POST | authorities | Smazání objednávky |
| `caio-lenavisage/customer/list` | GET | true | Seznam zákazníků |
| `caio-lenavisage/customer/create` | POST | true | Vytvoření zákazníka |
| `caio-lenavisage/customer/update` | POST | true | Úprava zákazníka |
| `caio-lenavisage/customer/delete` | POST | authorities | Smazání zákazníka |

## Client design

### Routy

| Route | Komponenta | Popis |
|---|---|---|
| `caio-lenavisage` | Wizard | Home = krokový wizard pro tvorbu objednávek |
| `caio-lenavisage/archive` | Archive | Archiv objednávek (roky / měsíce) |
| `caio-lenavisage/order` | OrderList | CRUD seznam objednávek (není v menu) |
| `caio-lenavisage/product` | ProductList | CRUD ceníků (není v menu) |
| `caio-lenavisage/customer` | CustomerList | CRUD zákazníků (není v menu) |

### Wizard flow (home route)

Krokový wizard na home route. Každý krok přidá parametr do URL a pushne history entry.
Nativní tlačítko "zpět" vrátí na předchozí krok. Optimalizováno pro mobil.

```
URL parametry                                  → Krok
(žádné)                                        → Home tiles (Vlasy, Řasy, Spol. akce, Svatba)
?product=hair                                  → Kategorie (Žena, Muž, Dítě)
?product=hair&category=woman                   → Délka vlasů (Krátké, Střední, Dlouhé)
?product=hair&category=woman&type=short        → Výběr služeb (toggle, multi-select)
?product=hair&category=woman&...&material=key  → Počet odměrek (0.5-8)
?product=hair&category=woman&...&confirm=1     → Potvrzení (zákazník, souhrn, poznámka)
?product=eyelash                               → Typ řas (Nové, Doplnění)
?product=eyelash&confirm=1                     → Potvrzení
?product=event                                 → Služby (Účes, Líčení - multi-select)
?product=event&confirm=1                       → Potvrzení
?product=wedding                               → Seznam svateb + create/edit/payment modály
```

### Archive route

- Taby s roky (z `order/listYears`)
- Per rok: panely dle měsíců s celkovou cenou
- Objednávky per rok z `order/list?year=YYYY`
- Prázdné měsíce skryty

### Souborová struktura (client)

```
caio-lenavisage/
  spa.js
  config/config.js
  components/
    button.js          (tile button 112x112, pink)
    tile-grid.js       (CSS grid)
    tile-buttons.js    (items → buttons mapper)
  model/
    order.js           (klientský Order model)
  home/
    wizard.js          (orchestrátor - čte URL params, renderuje krok)
    home-tiles.js      (Vlasy, Řasy, Spol. akce, Svatba)
    hair-category.js   (Žena, Muž, Dítě)
    hair-type.js       (Krátké, Střední, Dlouhé)
    service-select.js  (výběr služeb + materiál)
    quantity.js        (počet odměrek 0.5-8)
    eyelash.js         (Nové, Doplnění)
    event.js           (Účes, Líčení - multi-select)
    confirmation.js    (zákazník, souhrn, poznámka, potvrdit)
    customer-input.js  (FormTextSelect s insertable)
    wedding-list.js    (seznam svateb, create/edit/payment modály)
  archive/
    archive.js         (roky, měsíce, součty)
  order/               (CRUD - starší verze, není v menu)
  product/             (CRUD - starší verze, není v menu)
  customer/            (CRUD - starší verze, není v menu)
```
