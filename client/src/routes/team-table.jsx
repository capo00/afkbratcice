import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import StandingsTable from "../components/standings-table.jsx";
import EmptyState from "../components/empty-state.jsx";
import TeamShell from "../components/team/team-shell.jsx";
import { SeasonLink } from "../components/route-link.jsx";

// Tabulka soutěže mužstva.
//
// `stats/getTable` bere `seasonId`, nebo si sezónu **dohledá podle týmu** v aktuálním
// ročníku. Předává se tedy obojí: v archivu vyhrává vybraná sezóna, na výchozí routě
// (bez `seasonId`) si server najde tu letošní sám a klient nemusí nic dopočítávat.

function Table({ teamId, seasonId }) {
  const dataObject = useDataObject(
    {
      handlerMap: {
        load: () => UiElements.Call.cmdGet("/stats/getTable", seasonId ? { seasonId } : { teamId }),
      },
    },
    [teamId, seasonId],
  );

  const { state, data } = dataObject;
  const table = data?.table ?? [];

  return (
    <Section>
      {state === "pendingNoData" ? (
        <Uu5Elements.Skeleton height={280} />
      ) : table.length === 0 ? (
        // Soutěž bez tabulky (stará garda) i sezóna, ve které se ještě nehrálo, končí tady.
        // Rozlišovat je nemá cenu — pro čtenáře je to v obou případech „zatím nic".
        <EmptyState lsi={lsi("team", "noTable")} icon="uugds-view-list" />
      ) : (
        <StandingsTable
          table={table}
          ownTeamId={teamId}
          hasPenalties={Boolean(data?.season?.hasPenalties)}
          seasonId={data?.season?.id}
          header={
            data?.season?.competition ? (
              <SeasonLink seasonId={data.season.id} colorScheme="building" significance="subdued">
                {data.season.competition}
              </SeasonLink>
            ) : null
          }
        />
      )}
    </Section>
  );
}

const TeamTable = createVisualComponent({
  uu5Tag: Config.TAG + "TeamTable",

  render() {
    return <TeamShell>{({ teamId, seasonId }) => <Table teamId={teamId} seasonId={seasonId} />}</TeamShell>;
  },
});

export default TeamTable;
