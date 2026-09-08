import { createVisualComponent, useDataObject, useState, useMemo } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Button from "../components/layout/button.jsx";
import MatchTile from "../components/match-tile.jsx";
import EmptyState from "../components/empty-state.jsx";
import TeamShell from "../components/team/team-shell.jsx";

// Zápasy mužstva v sezóně — rozpis i výsledky na jedné ose.
//
// Dělí se to na dvě záložky nad **jedním** seznamem, ne dva dotazy: „co nás čeká" a „jak to
// dopadlo" jsou dvě otázky nad stejnými daty a server je nemá jak předfiltrovat lépe než
// podle `state`, který u odloženého zápasu lže.
//
// Odehrané se řadí **sestupně** (poslední nahoře), nadcházející vzestupně (nejbližší
// nahoře) — v obou případech je nahoře to, co člověk hledá. Výchozí záložka je ta, která
// má co ukázat: v průběhu sezóny rozpis, po jejím konci výsledky.

const FILTER_LIST = ["all", "home", "away"];

function isPlayed(match) {
  return Number.isFinite(match.homeGoals) && Number.isFinite(match.guestGoals);
}

// Přepínač je řada tlačítek, ne segmentovaný ovladač — aktivní se od ostatních liší jen
// `significance`. Sází se přes `components/layout/button.jsx`, aby se klubové písmo
// nepředepisovalo podruhé.
function ButtonRow({ itemList, active, onChange, path }) {
  return (
    <div className={Config.Css.css({ display: "flex", gap: 8, flexWrap: "wrap" })}>
      {itemList.map((code) => (
        <Button
          key={code}
          size="m"
          significance={code === active ? "highlighted" : "subdued"}
          onClick={() => onChange(code)}
          lsi={lsi(...path, code)}
        />
      ))}
    </div>
  );
}

function MatchList({ teamId, seasonId, category }) {
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState(null);

  const dataObject = useDataObject(
    {
      handlerMap: {
        load: () => UiElements.Call.cmdGet("/match/list", { teamId, seasonId, order: "asc" }),
      },
    },
    [teamId, seasonId],
  );

  const { state, data } = dataObject;

  const { played, upcoming } = useMemo(() => {
    const all = (data?.itemList ?? []).filter((match) => {
      if (filter === "home") return match.homeTeamId === teamId;
      if (filter === "away") return match.guestTeamId === teamId;
      return true;
    });

    return {
      played: all.filter(isPlayed).sort((a, b) => String(b.time ?? "").localeCompare(String(a.time ?? ""))),
      upcoming: all.filter((match) => !isPlayed(match)),
    };
  }, [data, filter, teamId]);

  // Výchozí záložka se volí až z dat, ne při prvním renderu: dokud seznam nedorazí,
  // nevíme, jestli sezóna běží. `mode === null` znamená „ještě nevybráno".
  const activeMode = mode ?? (upcoming.length ? "upcoming" : "played");
  const itemList = activeMode === "played" ? played : upcoming;

  return (
    <Section>
      <div
        className={Config.Css.css({
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBlockEnd: 24,
        })}
      >
        <ButtonRow
          itemList={["upcoming", "played"]}
          active={activeMode}
          onChange={setMode}
          path={["team", "matches", "mode"]}
        />
        <ButtonRow itemList={FILTER_LIST} active={filter} onChange={setFilter} path={["team", "matches", "filter"]} />
      </div>

      {state === "pendingNoData" ? (
        <Uu5Elements.Skeleton height={200} />
      ) : itemList.length === 0 ? (
        <EmptyState
          lsi={lsi("team", "matches", activeMode === "played" ? "noPlayed" : "noUpcoming")}
          icon="uugds-calendar"
        />
      ) : (
        <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))">
          {itemList.map((match) => (
            <MatchTile key={match.id} match={match} ownTeamId={teamId} category={category?.age} />
          ))}
        </Uu5Elements.Grid>
      )}
    </Section>
  );
}

const TeamMatches = createVisualComponent({
  uu5Tag: Config.TAG + "TeamMatches",

  render() {
    return (
      <TeamShell>
        {({ teamId, seasonId, category }) => (
          <MatchList teamId={teamId} seasonId={seasonId} category={category} />
        )}
      </TeamShell>
    );
  },
});

export default TeamMatches;
