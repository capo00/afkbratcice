import { createVisualComponent } from "uu5g05";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";

// Řádek odkazů na sociální sítě jako loga (patička, Kontakt). Logo, odkaz a nové okno kreslí
// `UiElements.SocialLink` z caio-ui (oficiální loga sítí, Caio 2026-11-23); tady je jen řádek
// a popisek z `Config.SOCIAL_LABEL` (alt a bublina). Síť, kterou caio-ui nezná, se vypíše textem.
const SocialLinks = createVisualComponent({
  uu5Tag: Config.TAG + "SocialLinks",

  render({ socialList = [], className }) {
    if (!socialList.length) return null;
    return (
      <div className={Config.Css.join(Config.Css.css({ display: "flex", gap: 16, alignItems: "center" }), className)}>
        {socialList.map(({ code, uri }) => (
          <UiElements.SocialLink key={code} type={code} value={uri} label={Config.SOCIAL_LABEL[code] ?? code} />
        ))}
      </div>
    );
  },
});

export { SocialLinks };
export default SocialLinks;
