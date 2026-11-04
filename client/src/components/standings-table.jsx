import { createVisualComponent, useScreenSize, useMemo, useState, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import { TeamLink } from "./route-link.jsx";
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
//
// **Na mobilu (xs, s) jen Z, skóre a body** (Caio 2026-11-04): i bez formy a VP/PP tabulka
// na telefon nevešla a jezdila do strany. Celou tabulku si čtenář zapne přepínačem v řádku
// se soutěží; výchozí je vypnuto a stav se nepamatuje. Na desktopu přepínač není.
const COMPACT_COLUMNS = ["played", "score", "points"];

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

    return isCompact ? all.filter((column) => COMPACT_COLUMNS.includes(column.code)) : all;
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

  // `ownTeamIdList`: víc vlastních týmů v jedné soutěži (A a B tým), jinak `ownTeamId`.
  // `seasonId`: sezóna tabulky -- název týmu vede na jeho detail v téhle sezóně.
  // `header`: řádek nad tabulkou (název soutěže); na mobilu se k němu přidá přepínač celé tabulky.
  render({ table = [], ownTeamId, ownTeamIdList, hasPenalties = false, seasonId, header }) {
    const [screenSize] = useScreenSize();
    const isMobile = screenSize === "xs" || screenSize === "s";
    const [showFull, setShowFull] = useState(false);
    const isCompact = isMobile && !showFull;
    const columns = useColumns({ hasPenalties, isCompact });

    return (
      <>
        {header || isMobile ? (
          <div
            className={Config.Css.css({
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "8px 16px",
              marginBlockEnd: 12,
            })}
          >
            {header ? (
              <Uu5Elements.Text
                category="interface"
                segment="content"
                type="medium"
                className={Config.Css.css({ color: theme.color.mutedFg })}
              >
                {header}
              </Uu5Elements.Text>
            ) : (
              <span />
            )}
            {isMobile ? (
              <Uu5Elements.Toggle
                value={showFull}
                onChange={(e) => setShowFull(e.data.value)}
                label={<Lsi import={importLsi} path={["table", "showFull"]} />}
                size="s"
              />
            ) : null}
          </div>
        ) : null}
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
              const isOwn = ownTeamIdList ? ownTeamIdList.includes(row.team?.id) : row.team?.id === ownTeamId;

              return (
                // Vlastní tým se pozná jen podle pozadí řádku a tučného písma; pořadí a body
                // mají barvu jako u ostatních (Caio 2026-10-28).
                <tr
                  key={row.team?.id ?? row.rank}
                  className={Config.Css.css({
                    backgroundColor: isOwn ? theme.color.accent : "transparent",
                    fontWeight: isOwn ? 700 : 400,
                  })}
                >
                  <DataTable.Td align="center" className={Config.Css.css({ color: theme.color.mutedFg, fontWeight: 700 })}>
                    {row.rank}
                  </DataTable.Td>

                  <DataTable.Th scope="row" className={Config.Css.css({ fontWeight: "inherit" })}>
                    <span className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
                      <TeamLogo uri={row.team?.logoUri} size={20} alt="" />
                      {/* Na úzkém displeji zkratka; když ji tým nemá, plný název je pořád
                        lepší než prázdno. */}
                      <TeamLink team={row.team} seasonId={seasonId}>
                        {(isMobile && row.team?.shortName) || row.team?.name || "—"}
                      </TeamLink>
                    </span>
                  </DataTable.Th>

                  {columns.map((column) => (
                    <DataTable.Td
                      key={column.code}
                      align={column.numeric ? "center" : "start"}
                      className={Config.Css.css({ fontWeight: column.strong ? 700 : "inherit" })}
                    >
                      {cellValue(row, column.code)}
                    </DataTable.Td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </>
    );
  },
});

export default StandingsTable;
