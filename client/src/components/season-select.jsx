import { createVisualComponent, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { seasonYears } from "../core/season-label.js";

const { theme } = Config;

// Přepínač sezóny — archiv. Sezóny (`season/list?teamId`, nejnovější první) načítá
// `team/team-shell.jsx`, protože z nich určuje i výchozí sezónu záložek; nabídka tak
// obsahuje jen ročníky, ve kterých tým opravdu hrál.
//
// Je to `Uu5Elements.Dropdown` (`label` + `itemList`), ne řada tlačítek jako u kategorií:
// sezón přibývá každý rok a po pár letech by se do lišty nevešly.
//
// **Ročník se zobrazuje jako `2025/26`, ne `2025`.** Server drží `yearFrom` (sezóna začíná
// v srpnu), ale fotbalový ročník nikdo neříká jedním číslem.

const SeasonSelect = createVisualComponent({
  uu5Tag: Config.TAG + "SeasonSelect",

  render({ seasonList = [], seasonId, onChange }) {
    const label = useLsi(importLsi, ["team", "season"]);

    // Jediná sezóna není z čeho vybírat; přepínač by byl jen ozdoba.
    if (seasonList.length < 2) return null;

    const active = seasonList.find((season) => season.id === seasonId) ?? seasonList[0];

    return (
      <Uu5Elements.Dropdown
        label={`${label}: ${seasonYears(active)}`}
        significance="subdued"
        colorScheme="building"
        itemList={seasonList.map((season) => ({
          children: seasonYears(season),
          onClick: () => onChange?.(season),
          significance: season.id === active.id ? "highlighted" : undefined,
        }))}
        className={Config.Css.css({ fontFamily: theme.font.body })}
      />
    );
  },
});

export default SeasonSelect;
