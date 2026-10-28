import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "../tools/caio-ui.js";
import Config from "../config/config.js";

const { theme } = Config;

// Logo týmu z `team.logoUri` (denormalizované URI binárky), bez něj placeholder.
//
// Bez loga je normální stav **u soupeřů**: okresní přebor má dvanáct týmů a logo od nich
// nikdo nesbírá. Dřív se místo chybějícího loga ukazoval erb AFK, takže soupeř vypadal
// jako náš tým; teď je to neutrální štít `uugds-shield` v barvě sekundárního textu
// (Caio 2026-10-28). Placeholder se ukáže i když se obrázek nepodaří stáhnout
// (`onError`) — binárka může zmizet z bucketu dřív než denormalizované URI z Monga.
//
// `UiElements.Image` je obyčejný <img> s `referrerPolicy="no-referrer"`; ten je pro GCS
// důležitý, protože bucket odmítá požadavky s cizím Refererem.

const TeamLogo = createVisualComponent({
  uu5Tag: Config.TAG + "TeamLogo",

  render({ uri, size = 32, alt = "" }) {
    const [failed, setFailed] = useState(false);

    // Erb i cizí loga jsou různě velká a různě oříznutá; společný rámeček je srovná
    // do jedné řady, aby v tabulce neposkakovala základní linka. Placeholder sedí ve
    // stejném rámečku.
    const frame = {
      inlineSize: size,
      blockSize: size,
      flexShrink: 0,
      borderRadius: theme.radius / 2,
    };

    if (!uri || failed) {
      return (
        <span
          aria-hidden="true"
          className={Config.Css.css({
            ...frame,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.color.mutedFg,
            fontSize: Math.round(size * 0.85),
            lineHeight: 1,
          })}
        >
          <Uu5Elements.Icon icon="uugds-shield" />
        </span>
      );
    }

    return (
      <UiElements.Image
        src={uri}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={Config.Css.css({ ...frame, objectFit: "contain" })}
      />
    );
  },
});

export default TeamLogo;
