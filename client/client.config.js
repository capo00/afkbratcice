// Konfigurace jen pro klienta, vrstva 2 (caio-devkit README, „Konfigurace appky“). Klíče 1. úrovně
// jsou standardní -- devkit je validuje při buildu (neznámý klíč build shodí), caio-ui je bere jako
// výchozí hodnoty svých propsů. Appka ho předává `<UiApp.SpaProvider config={clientConfig}>` v obou
// UVE (app.jsx, admin/app.jsx). Vlastní hodnoty klienta jsou jen pod `app`: to, co se opakuje ve víc
// souborech klienta (čte je src/config/config.js a src/config/theme.js).
//
// `top.adminLink` tu schválně není: role, které do administrace smí, skládá src/config/admin-menu.js
// z obrazovek, a lišta webu je dostává odtamtud (app.jsx) -- seznam tady by se s ním rozešel.
export default {
  // uu5 tag appky: prefix jmen komponent a CSS modulu (src/config/config.js).
  tag: "Afk.",

  app: {
    // Bebas Neue je úzký velkopísmenný grotesk -- sportovní charakter předlohy stojí na něm.
    // Barlow je nízkokontrastní grotesk, drží text klidný. Oba se self-hostují (src/fonts.css).
    //
    // Fallbacky jsou naschvál konkrétní: než dorazí woff2 soubory, jede web na nich a nesmí
    // spadnout na patkové výchozí písmo prohlížeče.
    font: {
      display: '"Bebas Neue", Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
      body: '"Barlow", system-ui, -apple-system, "Segoe UI", sans-serif',
    },

    // Rozměry stránky (src/config/theme.js). Velikost písma tu není žádná: tu dává uuGds
    // (design/ux-design-system.md, 2.1).
    layout: {
      radius: 8,
      maxWidth: 1152,
      gutter: { xs: 16, s: 24 },
      // Vertikální padding sekce. Předloha má 64 px konstantně, bez nárůstu na širokém
      // desktopu -- rytmus drží spíš střídání podkladů než výška mezer.
      sectionPad: 64,
      // Výška lišty z caio-ui (56) + prostor, aby kotva nekončila těsně pod ní.
      topHeight: 56,
      anchorOffset: 80,
    },

    // Statické soubory z src/assets/. Vite je kopíruje do build outputu 1:1, takže cesta je
    // absolutní od rootu webu -- ne import, aby se obrázek nebalil do bundlu. Erb v liště je tatáž
    // ikona, kterou používá manifest a favicon, aby se nemohly rozejít.
    asset: {
      logo: "/assets/meta/icon-192.png",
      logoTransparent: "/assets/icon-192-transparent.png",
    },

    // Popisky sítí z nastavení klubu (`socialList`). Nejsou v LSI schválně -- jsou to obchodní
    // názvy, které se nepřekládají. Pořadí je i pořadí polí v Nastavení.
    //
    // **Nejsou to ikony.** GDS stencil sada nemá skupinu `logo`, takže `uugdsstencil-logo-facebook`
    // se vykreslí jako prázdné místo se správnou šířkou (component-tree.md, F.2; ověřeno
    // v prohlížeči 7. 9. 2026). Odkazy jsou proto textové.
    socialLabel: {
      facebook: "Facebook",
      instagram: "Instagram",
      youtube: "YouTube",
    },
  },
};
