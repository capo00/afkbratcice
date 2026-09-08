import { createVisualComponent, useScreenSize, useMemo, Lsi } from "uu5g05";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import TeamLogo from "./team-logo.jsx";
import FormDots from "./form-dots.jsx";
import DataTable from "./data-table.jsx";

const { theme } = Config;

// Tabulka soutěže.
//
// Je to **vlastní `<table>`, ne `Uu5Tiles.Table`** (design/component-tree.md, D.2): tabulka
// nic neřadí ani nefiltruje, zato potřebuje tři věci, které Uu5Tiles neumí — zvýraznit řádek
// vlastního týmu klubovou barvou, skrývat sloupce po breakpointech a zůstat sémantickou
// tabulkou kvůli čtečkám a SEO. Zápasy naopak `Uu5Tiles.Table` používají, protože řazení
// a filtry chtějí zadarmo.
//
// Obal, sazbu buněk a vodorovný scroll drží `components/data-table.jsx` — sdílí je se
// statistikami hráče a mužstva. Řádky zůstávají tady, protože zvýraznění vlastního týmu
// je pravidlo jen téhle tabulky.
//
// **Sloupce VP/PP se ukazují jen tam, kde dávají smysl.** Okresní soutěže se dělí na ty
// s penaltovým rozstřelem (výhra 3 / na penalty 2 / prohra na penalty 1) a bez něj (remíza
// za bod). Říká to `season.hasPenalties`, ne data: soutěž s rozstřelem, ve které zatím
// žádná remíza nebyla, vypadá v zápasech stejně jako soutěž bez něj — tabulka by tedy po
// první remíze sama přeskočila na jiné sloupce i jiné bodování.

const COMPACT_HIDDEN = ["penaltyWins", "penaltyLosses", "form"];

function useColumns({ hasPenalties, isCompact }) {
  return useMemo(() => {
    const all = [
      { code: "played", numeric: true },
      { code: "wins", numeric: true },
      ...(hasPenalties
        ? [
            { code: "penaltyWins", numeric: true },
            { code: "penaltyLosses", numeric: true },
          ]
        : [{ code: "draws", numeric: true }]),
      { code: "losses", numeric: true },
      { code: "score", numeric: true },
      { code: "points", numeric: true, strong: true },
      { code: "form" },
    ];

    return isCompact ? all.filter((column) => !COMPACT_HIDDEN.includes(column.code)) : all;
  }, [hasPenalties, isCompact]);
}

function cellValue(row, code) {
  switch (code) {
    case "score":
      return `${row.goalsFor}:${row.goalsAgainst}`;
    case "form":
      return <FormDots form={row.form} />;
    default:
      return row[code];
  }
}

const StandingsTable = createVisualComponent({
  uu5Tag: Config.TAG + "StandingsTable",

  render({ table = [], ownTeamId, hasPenalties = false }) {
    const [screenSize] = useScreenSize();
    const isCompact = screenSize === "xs" || screenSize === "s";
    const columns = useColumns({ hasPenalties, isCompact });

    return (
      <DataTable>
        <thead>
          <DataTable.HeaderRow>
            <DataTable.Th align="center">#</DataTable.Th>
            <DataTable.Th>
              <Lsi import={importLsi} path={["table", "team"]} />
            </DataTable.Th>
            {columns.map((column) => (
              <DataTable.Th key={column.code} align={column.numeric ? "center" : "start"}>
                <Lsi import={importLsi} path={["table", column.code]} />
              </DataTable.Th>
            ))}
          </DataTable.HeaderRow>
        </thead>

        <tbody>
          {table.map((row) => {
            const isOwn = row.team?.id === ownTeamId;

            return (
              <tr
                key={row.team?.id ?? row.rank}
                className={Config.Css.css({
                  backgroundColor: isOwn ? theme.color.accent : "transparent",
                  fontWeight: isOwn ? 700 : 400,
                })}
              >
                <DataTable.Td
                  align="center"
                  className={Config.Css.css({
                    color: isOwn ? theme.color.clubRed : theme.color.mutedFg,
                    fontWeight: 700,
                  })}
                >
                  {row.rank}
                </DataTable.Td>

                <DataTable.Th scope="row" className={Config.Css.css({ fontWeight: "inherit" })}>
                  <span className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
                    <TeamLogo uri={row.team?.logoUri} size={20} alt="" />
                    {/* Na úzkém displeji zkratka; když ji tým nemá, plný název je pořád
                        lepší než prázdno. */}
                    <span>{(isCompact && row.team?.shortName) || row.team?.name || "—"}</span>
                  </span>
                </DataTable.Th>

                {columns.map((column) => (
                  <DataTable.Td
                    key={column.code}
                    align={column.numeric ? "center" : "start"}
                    className={Config.Css.css({
                      fontWeight: column.strong ? 700 : "inherit",
                      color: column.strong && isOwn ? theme.color.clubRed : "inherit",
                    })}
                  >
                    {cellValue(row, column.code)}
                  </DataTable.Td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    );
  },
});

export default StandingsTable;
