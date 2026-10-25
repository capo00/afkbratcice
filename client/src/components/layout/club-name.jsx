import { useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";

const { theme } = Config;

/**
 * Název klubu vedle erbu v liště webu i administrace — dva řádky sázené GDS tokeny, ale
 * klubovým písmem.
 *
 * Skládá se **z vlastních elementů, ne z `Uu5Elements.Header`**. Header nemá token pro
 * font a title i subtitle si renderuje jako `Uu5Elements.Text` s explicitní
 * `font-family`, takže zdědění z rodiče nestačí — jediná cesta k němu vedla přes
 * selektor `[data-name="Uu5Elements.Text"]`. A ten **v produkčním buildu neexistuje**:
 * `data-name` je vývojová pomůcka, kterou uu5 v produkci nevypisuje, takže erb měl
 * v ostrém provozu vedle sebe Barlow místo Bebasu (nalezeno 7. 9. 2026).
 *
 * Velikost dál počítá GDS přes `Uu5Elements.Text` a jeho `children` jako funkci —
 * stejný postup jako `components/layout/heading.jsx`. Přebíjí se jen to, co token nemá:
 * rodina písma, prostrkání a verzálky.
 *
 * @param subtitle druhý řádek; bez něj „od roku …“ z LSI (admin tu má „Administrace“).
 */
function ClubName({ subtitle }) {
  const name = useLsi(importLsi, ["club", "name"]);
  const since = useLsi(importLsi, ["club", "since"]);

  return (
    // Dva řádky nalepené na sebe, vycentrované na výšku lišty: `rowGap={0}` je tu proto,
    // že výchozí mezera `Grid` (24 px z `loose`) je mezera mezi dlaždicemi, ne mezi řádky
    // jednoho popisku.
    <Uu5Elements.Grid alignContent="center" rowGap={0}>
      <Uu5Elements.Text category="interface" segment="title" type="minor">
        {({ style }) => (
          <span
            className={Config.Css.css({
              ...style,
              ...theme.typography.display,
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            })}
          >
            {name}
          </span>
        )}
      </Uu5Elements.Text>
      <Uu5Elements.Text category="interface" segment="highlight" type="small" colorScheme="primary">
        {({ style }) => (
          <span
            className={Config.Css.css({
              ...style,
              ...theme.typography.eyebrow,
            })}
          >
            {subtitle ?? since}
          </span>
        )}
      </Uu5Elements.Text>
    </Uu5Elements.Grid>
  );
}

export { ClubName };
export default ClubName;
