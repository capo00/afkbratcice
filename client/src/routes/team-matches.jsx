import { createVisualComponent, useDataObject, useState, useMemo, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import MatchTile from "../components/match-tile.jsx";
import EmptyState from "../components/empty-state.jsx";
import DataState from "../components/data-state.jsx";
import TeamShell from "../components/team/team-shell.jsx";
import { useApp } from "../core/app-context.jsx";

const { theme } = Config;

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

// Přepínač je `ButtonGroup` (review 1.3 B, Caio 2026-11-17): vybraná položka `highlighted`,
// ostatní `subdued`, vše v primary, takže vzhled zůstal jako u dřívější řady tlačítek.
// `pressed` dává čtečce `aria-pressed`, kterou samostatná tlačítka neměla. Klubové písmo
// (Bebas s prostrkáním) se přimíchává jako u `components/layout/button.jsx`, token pro něj není.
const CLUB_FONT_CSS = Config.Css.css({
  "& button": { fontFamily: theme.font.display, letterSpacing: "0.1em", textTransform: "uppercase" },
});

function ButtonRow({ itemList, active, onChange, path }) {
  return (
    <Uu5Elements.ButtonGroup
      size="m"
      colorScheme="primary"
      className={CLUB_FONT_CSS}
      itemList={itemList.map((code) => ({
        children: <Lsi lsi={lsi(...path, code)} />,
        pressed: code === active,
        significance: code === active ? "highlighted" : "subdued",
        onClick: () => onChange(code),
      }))}
    />
  );
}

function MatchList({ teamId, seasonId, category }) {
  const { getTeam } = useApp();
  // Z čího pohledu dlaždice ukazuje výhru/prohru: mužstvo stránky, je-li naše; u soupeře
  // náš tým v zápase, jinak nikdo -- odznak patří jen zápasům AFK (match-tile.jsx).
  const ownTeamOf = (match) =>
    getTeam(teamId)?.own ? teamId : [match.homeTeamId, match.guestTeamId].find((id) => getTeam(id)?.own);
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

      {state === "pendingNoData" || state === "errorNoData" ? (
        <DataState dataObject={dataObject} height={200} />
      ) : itemList.length === 0 ? (
        <EmptyState
          lsi={lsi("team", "matches", activeMode === "played" ? "noPlayed" : "noUpcoming")}
          icon="uugds-calendar"
        />
      ) : (
        <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))">
          {itemList.map((match) => (
            <MatchTile key={match.id} match={match} ownTeamId={ownTeamOf(match)} category={category?.categoryName} />
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
