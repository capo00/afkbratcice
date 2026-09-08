import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { useApp } from "../../core/app-context.jsx";

// Upozornění redakce (`appConfig.notice`) — „zápas se přesouvá na neděli", „trénink
// v pátek v 17:00".
//
// **Není to celostránkový pruh pod lištou.** Ve v0 stálo v pravém sloupci na každé
// stránce a při přepisu z něj byl proužek nade vším; jenže obsah upozornění se týká
// mužstva, ne úvodní stránky ani novinek, a nad každou obrazovkou z něj byl šum. Od
// 8. 9. 2026 se vykresluje **jen na detailu mužstva** (`components/team/team-shell.jsx`),
// tedy tam, kde ho čte ten, komu je určené.
//
// Vzhled dělá `Uu5Elements.HighlightedBox`: ikona, text a zavírací křížek jsou jeho vlastní
// mřížka, takže se tu neskládá flex s vlastními barvami. `Uu5Elements.Alert` by byla chyba —
// ta se registruje do `AlertBus`, portáluje se do plovoucího kontejneru a sama zmizí po
// `durationMs`. To je toast, ne trvalé upozornění na stránce.
//
// Zavření se pamatuje v `sessionStorage`, ne `localStorage`: upozornění bývá krátkodobé,
// takže se má znovu ukázat při další návštěvě. A klíč nese **hash textu**, aby nové
// upozornění nezůstalo schované jen proto, že návštěvník zavřel to předchozí.

const KEY_PREFIX = "afk-notice-";

function storageKey(notice) {
  // Krátký deterministický otisk — nepotřebujeme kryptografii, jen ať se dva různé texty
  // netrefí do stejného klíče.
  let hash = 0;
  for (let i = 0; i < notice.length; i++) hash = (hash * 31 + notice.charCodeAt(i)) | 0;
  return KEY_PREFIX + (hash >>> 0).toString(36);
}

function readDismissed(key) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    // Privátní okno, zablokované úložiště. Neschopnost si zapamatovat zavření není důvod
    // upozornění nezobrazit.
    return false;
  }
}

const NoticeBar = createVisualComponent({
  uu5Tag: Config.TAG + "NoticeBar",

  render(props) {
    const { appConfig } = useApp();
    const notice = appConfig?.notice?.trim();
    const key = notice ? storageKey(notice) : null;
    const [dismissed, setDismissed] = useState(() => (key ? readDismissed(key) : false));

    if (!notice || dismissed) return null;

    return (
      <Uu5Elements.HighlightedBox
        {...props}
        icon="uugds-alert-circle"
        colorScheme="primary"
        significance="distinct"
        onClose={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem(key, "1");
          } catch {
            // Viz readDismissed — zavření se pak nepamatuje, ale zavřít jde.
          }
        }}
      >
        {notice}
      </Uu5Elements.HighlightedBox>
    );
  },
});

export default NoticeBar;
