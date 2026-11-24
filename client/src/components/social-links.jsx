import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";

// Odkazy na sítě jen jako logo, bez textu (Caio 2026-11-23, stejně jako v caio_propertyman).
// Oficiální loga z brand center Mety, PNG 128 px; nesmí se přebarvovat ani upravovat, proto
// obyčejné `<img>`. Název sítě nese `alt` (zároveň přístupný název odkazu) a `title` (bublina).
// Soubory jsou v `client/src/assets/social/` a jedou ze statiky pod `/assets/social/`.
//
// Neznámý `code` (např. youtube) logo nemá, vypíše se jako text, ať odkaz nezmizí.
const LOGO = {
  facebook: "/assets/social/facebook.png",
  instagram: "/assets/social/instagram.png",
};

const SIZE = 32;

const SocialLinks = createVisualComponent({
  uu5Tag: Config.TAG + "SocialLinks",

  render({ socialList = [], className }) {
    if (!socialList.length) return null;
    return (
      <div className={[Config.Css.css({ display: "flex", gap: 16, alignItems: "center" }), className].filter(Boolean).join(" ")}>
        {socialList.map(({ code, uri }) => {
          const label = Config.SOCIAL_LABEL[code] ?? code;
          return (
            <a key={code} href={uri} target="_blank" rel="noopener noreferrer" title={label}>
              {LOGO[code] ? (
                <img
                  src={LOGO[code]}
                  alt={label}
                  width={SIZE}
                  height={SIZE}
                  className={Config.Css.css({ display: "block" })}
                />
              ) : (
                label
              )}
            </a>
          );
        })}
      </div>
    );
  },
});

export default SocialLinks;
