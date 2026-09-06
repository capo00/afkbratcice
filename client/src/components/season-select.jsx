import { createVisualComponent, useDataObject, useMemo, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";

const { theme } = Config;

// Přepínač sezóny — archiv. Sezóny se berou `season/list?teamId`, takže nabídka obsahuje
// jen ročníky, ve kterých tým opravdu hrál; prázdná sezóna se nikde neobjeví.
//
// Je to `Uu5Elements.Dropdown` (`label` + `itemList`), ne řada tlačítek jako u kategorií:
// sezón přibývá každý rok a po pár letech by se do lišty nevešly.
//
// **Ročník se zobrazuje jako `2025/26`, ne `2025`.** Server drží `yearFrom` (sezóna začíná
// v srpnu), ale fotbalový ročník nikdo neříká jedním číslem.

function seasonLabel(season) {
  const from = Number(season.yearFrom);
  if (!Number.isFinite(from)) return season.yearFrom ?? "—";
  return `${from}/${String((from + 1) % 100).padStart(2, "0")}`;
}

const SeasonSelect = createVisualComponent({
  uu5Tag: Config.TAG + "SeasonSelect",

  render({ teamId, seasonId, onChange }) {
    const label = useLsi(importLsi, ["team", "season"]);

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: () =>
            teamId ? UiElements.Call.cmdGet("/season/list", { teamId }) : Promise.resolve({ itemList: [] }),
        },
      },
      [teamId],
    );

    const seasonList = useMemo(() => {
      const list = [...(dataObject.data?.itemList ?? [])];
      // Nejnovější první — archiv se prochází odzadu.
      list.sort((a, b) => String(b.yearFrom ?? "").localeCompare(String(a.yearFrom ?? "")));
      return list;
    }, [dataObject.data]);

    // Jediná sezóna není z čeho vybírat; přepínač by byl jen ozdoba.
    if (seasonList.length < 2) return null;

    const active = seasonList.find((season) => season.id === seasonId) ?? seasonList[0];

    return (
      <Uu5Elements.Dropdown
        label={`${label}: ${seasonLabel(active)}`}
        significance="subdued"
        colorScheme="building"
        itemList={seasonList.map((season) => ({
          children: seasonLabel(season),
          onClick: () => onChange?.(season),
          significance: season.id === active.id ? "highlighted" : undefined,
        }))}
        className={Config.Css.css({ fontFamily: theme.font.body })}
      />
    );
  },
});

export { seasonLabel };
export default SeasonSelect;
