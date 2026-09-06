import { createVisualComponent, useScreenSize, useMemo, Lsi } from "uu5g05";
import Config from "../config/config.js";
import importLsi from "../lsi/import-lsi.js";
import TeamLogo from "./team-logo.jsx";
import FormDots from "./form-dots.jsx";

const { theme } = Config;

// Tabulka soutěže.
//
// Je to **vlastní `<table>`, ne `Uu5Tiles.Table`** (design/component-tree.md, D.2): tabulka
// nic neřadí ani nefiltruje, zato potřebuje tři věci, které Uu5Tiles neumí — zvýraznit řádek
// vlastního týmu klubovou barvou, skrývat sloupce po breakpointech a zůstat sémantickou
// tabulkou kvůli čtečkám a SEO. Zápasy naopak `Uu5Tiles.Table` používají, protože řazení
// a filtry chtějí zadarmo.
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

    const cell = Config.Css.css({
      paddingBlock: 10,
      paddingInline: 8,
      borderBlockEnd: `1px solid ${theme.color.border}`,
      whiteSpace: "nowrap",
    });

    return (
      // Tabulka je na úzkém displeji širší než obrazovka i po skrytí sloupců, takže se
      // scrolluje vodorovně uvnitř svého rámečku — ne celá stránka.
      <div className={Config.Css.css({ overflowX: "auto" })}>
        <table
          className={Config.Css.css({
            inlineSize: "100%",
            borderCollapse: "collapse",
            fontVariantNumeric: "tabular-nums",
          })}
        >
          <thead>
            <tr className={Config.Css.css({ ...theme.typography.eyebrow, fontSize: 11, textAlign: "start" })}>
              <th className={cell} scope="col">
                #
              </th>
              <th className={cell + " " + Config.Css.css({ textAlign: "start" })} scope="col">
                <Lsi import={importLsi} path={["table", "team"]} />
              </th>
              {columns.map((column) => (
                <th
                  key={column.code}
                  scope="col"
                  className={cell + " " + Config.Css.css({ textAlign: column.numeric ? "center" : "start" })}
                >
                  <Lsi import={importLsi} path={["table", column.code]} />
                </th>
              ))}
            </tr>
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
                  <td
                    className={
                      cell +
                      " " +
                      Config.Css.css({
                        textAlign: "center",
                        color: isOwn ? theme.color.clubRed : theme.color.mutedFg,
                        fontWeight: 700,
                      })
                    }
                  >
                    {row.rank}
                  </td>

                  <th
                    scope="row"
                    className={cell + " " + Config.Css.css({ textAlign: "start", fontWeight: "inherit" })}
                  >
                    <span className={Config.Css.css({ display: "flex", alignItems: "center", gap: 8 })}>
                      <TeamLogo uri={row.team?.logoUri} size={20} alt="" />
                      {/* Na úzkém displeji zkratka; když ji tým nemá, plný název je pořád
                          lepší než prázdno. */}
                      <span>{(isCompact && row.team?.shortName) || row.team?.name || "—"}</span>
                    </span>
                  </th>

                  {columns.map((column) => (
                    <td
                      key={column.code}
                      className={
                        cell +
                        " " +
                        Config.Css.css({
                          textAlign: column.numeric ? "center" : "start",
                          fontWeight: column.strong ? 700 : "inherit",
                          color: column.strong && isOwn ? theme.color.clubRed : "inherit",
                        })
                      }
                    >
                      {cellValue(row, column.code)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
});

export default StandingsTable;
