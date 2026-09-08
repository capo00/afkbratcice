import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

const { theme } = Config;

// Jednotný prázdný stav seznamu.
//
// Návrh na tom trvá u každého seznamu (design/frontend.md, 8): kategorie bez sezóny, sezóna
// bez zápasů, soutěž bez tabulky, album bez fotek. Starý web na to nemyslel a prázdný seznam
// vypadal jako rozbitá stránka.
//
// Rámeček je `Uu5Elements.Box` se `significance="subdued"` — tvar `ground` má v GDS právě
// v téhle váze linku bez výplně a bez stínu, což je přesně předloha (ux-design-system.md, 3).
// Vlastní `border` + `borderRadius` by dělaly totéž o dvě barvy vedle.
//
// Text je **povinný** — bez `lsi` by komponenta vykreslila prázdný rámeček, což je přesně to,
// čemu má zabránit. Volitelná `action` je pro případy, kdy z prázdna vede cesta ven
// (např. přepnout sezónu).

const EmptyState = createVisualComponent({
  uu5Tag: Config.TAG + "EmptyState",

  render(props) {
    const { lsi, icon = "uugds-alert-circle", action } = props;

    return (
      <Uu5Elements.Box
        significance="subdued"
        borderRadius="moderate"
        className={Config.Css.css({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          padding: 32,
          textAlign: "center",
          color: theme.color.mutedFg,
        })}
      >
        <Uu5Elements.Icon icon={icon} className={Config.Css.css({ fontSize: 28, opacity: 0.6 })} />
        <Uu5Elements.Text category="interface" segment="content" type="medium">
          <Lsi lsi={lsi} />
        </Uu5Elements.Text>
        {action}
      </Uu5Elements.Box>
    );
  },
});

export default EmptyState;
