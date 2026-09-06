import { createVisualComponent, useState, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { useApp } from "../../core/app-context.jsx";

const { theme } = Config;

// Úzký proužek „Upozornění!" pod horní lištou.
//
// Ve v0 byl v pravém sloupci na každé stránce; ten sloupec nová verze nemá, ale obsah se
// nezahazuje — jen se přesouvá tam, kam patří (design/frontend.md, 3.12). Proužek je nad
// obsahem na všech stránkách, protože se týká celého klubu, ne jedné obrazovky.
//
// Zavření se pamatuje v `sessionStorage`, ne `localStorage`: upozornění bývá krátkodobé
// („zápas se přesouvá na neděli"), takže se má znovu ukázat při další návštěvě. A klíč nese
// **hash textu**, aby nové upozornění nezůstalo schované jen proto, že návštěvník zavřel
// to předchozí.

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

    const attrs = Utils.VisualComponent.getAttrs(
      props,
      Config.Css.css({
        backgroundColor: theme.color.muted,
        borderBlockEnd: `1px solid ${theme.color.border}`,
      }),
    );

    return (
      <div {...attrs}>
        <div
          className={Config.Css.css({
            maxWidth: theme.maxWidth,
            marginInline: "auto",
            paddingInline: theme.gutter.s,
            paddingBlock: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
          })}
        >
          <Uu5Elements.Icon
            icon="uugds-alert-circle"
            className={Config.Css.css({ color: theme.color.clubRed, flexShrink: 0 })}
          />
          <Uu5Elements.Text
            category="interface"
            segment="content"
            type="medium"
            className={Config.Css.css({ flexGrow: 1 })}
          >
            {notice}
          </Uu5Elements.Text>
          <Uu5Elements.Button
            icon="uugds-close"
            significance="subdued"
            size="s"
            tooltip="Zavřít"
            onClick={() => {
              setDismissed(true);
              try {
                sessionStorage.setItem(key, "1");
              } catch {
                // Viz readDismissed — zavření se pak nepamatuje, ale zavřít jde.
              }
            }}
          />
        </div>
      </div>
    );
  },
});

export default NoticeBar;
