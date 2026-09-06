import { createVisualComponent, useDataObject, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import EmptyState from "../components/empty-state.jsx";
import TeamShell from "../components/team/team-shell.jsx";

const { theme } = Config;

// Statistiky hráčů v sezóně — starty, góly, karty.
//
// Server je agreguje v Mongu nad `match.playerList` a **řadí podle gólů**, takže nahoře
// jsou střelci; klient pořadí nemění. Do statistik jdou jen odehrané soutěžní zápasy,
// stejné pravidlo jako u tabulky (`services/stats.js`).
//
// Jména mládeže sem ze serveru nechodí, stejně jako na soupisce — místo jména je číslo
// dresu.

const COLUMN_LIST = [
  { code: "appearances", numeric: true },
  { code: "starts", numeric: true },
  { code: "goals", numeric: true, strong: true },
  { code: "yellowCards", numeric: true },
  { code: "redCards", numeric: true },
];

function playerLabel(row) {
  const name = [row.person?.name, row.person?.surname].filter(Boolean).join(" ");
  if (name) return name;
  return row.player?.number ? `#${row.player.number}` : null;
}

function Stats({ teamId, seasonId }) {
  const dataObject = useDataObject(
    {
      handlerMap: {
        load: () => UiElements.Call.cmdGet("/stats/listPlayerStats", seasonId ? { seasonId, teamId } : { teamId }),
      },
    },
    [teamId, seasonId],
  );

  const { state, data } = dataObject;
  const itemList = data?.itemList ?? [];

  const cell = Config.Css.css({
    paddingBlock: 10,
    paddingInline: 8,
    borderBlockEnd: `1px solid ${theme.color.border}`,
    whiteSpace: "nowrap",
  });

  return (
    <Section>
      {state === "pendingNoData" ? (
        <Uu5Elements.Skeleton height={240} />
      ) : itemList.length === 0 ? (
        <EmptyState lsi={lsi("team", "noStats")} icon="uugds-view-list" />
      ) : (
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
                <th className={cell + " " + Config.Css.css({ textAlign: "start" })} scope="col">
                  <Lsi import={importLsi} path={["stats", "player"]} />
                </th>
                {COLUMN_LIST.map((column) => (
                  <th key={column.code} scope="col" className={cell + " " + Config.Css.css({ textAlign: "center" })}>
                    <Lsi import={importLsi} path={["stats", column.code]} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {itemList.map((row) => (
                <tr key={row.playerId}>
                  <th scope="row" className={cell + " " + Config.Css.css({ textAlign: "start", fontWeight: 400 })}>
                    <span className={Config.Css.css({ display: "flex", alignItems: "baseline", gap: 8 })}>
                      <span>{playerLabel(row) ?? <Lsi import={importLsi} path={["team", "unnamedPlayer"]} />}</span>
                      {row.player?.position ? (
                        <span className={Config.Css.css({ color: theme.color.mutedFg, fontSize: 12 })}>
                          <Lsi import={importLsi} path={["enum", "position", row.player.position]} />
                        </span>
                      ) : null}
                    </span>
                  </th>
                  {COLUMN_LIST.map((column) => (
                    <td
                      key={column.code}
                      className={
                        cell +
                        " " +
                        Config.Css.css({
                          textAlign: "center",
                          fontWeight: column.strong ? 700 : 400,
                          color: column.strong && row[column.code] ? theme.color.clubRed : "inherit",
                        })
                      }
                    >
                      {row[column.code] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

const TeamStats = createVisualComponent({
  uu5Tag: Config.TAG + "TeamStats",

  render() {
    return <TeamShell>{({ teamId, seasonId }) => <Stats teamId={teamId} seasonId={seasonId} />}</TeamShell>;
  },
});

export default TeamStats;
