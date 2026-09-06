import { createVisualComponent, useState } from "uu5g05";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";

const { theme } = Config;

// Logo týmu z `team.logoUri` (denormalizované URI binárky), s fallbackem na klubový erb.
//
// Fallback je potřeba **pro soupeře**, ne pro nás: okresní přebor má dvanáct týmů a logo
// od nich nikdo nesbírá, takže prázdné `logoUri` je normální stav. Erb se použije i když
// se obrázek nepodaří stáhnout (`onError`) — binárka může zmizet z bucketu dřív než
// denormalizované URI z Monga.
//
// `UiElements.Image` je obyčejný <img> s `referrerPolicy="no-referrer"`; ten je pro GCS
// důležitý, protože bucket odmítá požadavky s cizím Refererem.

const TeamLogo = createVisualComponent({
  uu5Tag: Config.TAG + "TeamLogo",

  render({ uri, size = 32, alt = "" }) {
    const [failed, setFailed] = useState(false);
    const src = !uri || failed ? Config.asset.logo : uri;

    return (
      <UiElements.Image
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={Config.Css.css({
          inlineSize: size,
          blockSize: size,
          objectFit: "contain",
          // Erb i cizí loga jsou různě velká a různě oříznutá; společný rámeček je srovná
          // do jedné řady, aby v tabulce neposkakovala základní linka.
          flexShrink: 0,
          borderRadius: theme.radius / 2,
        })}
      />
    );
  },
});

export default TeamLogo;
