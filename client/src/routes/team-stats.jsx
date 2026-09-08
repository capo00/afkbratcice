import { createVisualComponent, useDataObject, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import DataTable from "../components/data-table.jsx";
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

  return (
    <Section>
      {state === "pendingNoData" ? (
        <Uu5Elements.Skeleton height={240} />
      ) : itemList.length === 0 ? (
        <EmptyState lsi={lsi("team", "noStats")} icon="uugds-view-list" />
      ) : (
        <DataTable>
          <thead>
            <DataTable.HeaderRow>
              <DataTable.Th>
                <Lsi import={importLsi} path={["stats", "player"]} />
              </DataTable.Th>
              {COLUMN_LIST.map((column) => (
                <DataTable.Th key={column.code} align="center">
                  <Lsi import={importLsi} path={["stats", column.code]} />
                </DataTable.Th>
              ))}
            </DataTable.HeaderRow>
          </thead>
          <tbody>
            {itemList.map((row) => (
              <tr key={row.playerId}>
                <DataTable.Th scope="row" className={Config.Css.css({ fontWeight: 400 })}>
                  <span className={Config.Css.css({ display: "flex", alignItems: "baseline", gap: 8 })}>
                    <span>{playerLabel(row) ?? <Lsi import={importLsi} path={["team", "unnamedPlayer"]} />}</span>
                    {row.player?.position ? (
                      <span className={Config.Css.css({ color: theme.color.mutedFg, fontSize: 12 })}>
                        <Lsi import={importLsi} path={["enum", "position", row.player.position]} />
                      </span>
                    ) : null}
                  </span>
                </DataTable.Th>
                {COLUMN_LIST.map((column) => (
                  <DataTable.Td
                    key={column.code}
                    className={Config.Css.css({
                      fontWeight: column.strong ? 700 : 400,
                      color: column.strong && row[column.code] ? theme.color.clubRed : "inherit",
                    })}
                  >
                    {row[column.code] ?? 0}
                  </DataTable.Td>
                ))}
              </tr>
            ))}
          </tbody>
        </DataTable>
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
