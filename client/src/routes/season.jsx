import { createVisualComponent, useDataObject, useEffect, useMemo, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiElements } from "caio-ui";
import Config from "../config/config.js";
import importLsi, { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";
import MatchTile from "../components/match-tile.jsx";
import StandingsTable from "../components/standings-table.jsx";
import EmptyState from "../components/empty-state.jsx";
import DateText from "../components/date-text.jsx";
import { seasonLabel } from "../components/season-select.jsx";
import { useApp } from "../core/app-context.jsx";
import { usePageTitle } from "../tools/page-meta.js";

const { theme } = Config;

// Detail sezóny (ročníku soutěže): tabulka a pod ní **všechna kola** se zápasy, i ta, která
// náš tým nehrál -- z detailu zápasu se dá dostat jen ke kolům, ve kterých hrál.
//
// Kola jsou sekce pod sebou, nejnovější nahoře (Caio 2026-11-03): rozehraná sezóna se čte
// od posledního kola, v archivu je nahoře konec soutěže. Přátelské zápasy (bez kola) sem
// nepatří. `kolo` v adrese odroluje na sekci toho kola (proklik z detailu zápasu).
//
// Server na to vlastní use case nemá: kola jsou jen `match/list?seasonId` seskupené podle
// `round` (string, řadí se číselně) a tabulka je `stats/getTable`.

const roundAnchor = (round) => `kolo-${round}`;

/** Číselně, ne abecedně: „10“ až za „9“. Nečíselné kolo (nemělo by být) na konec. */
function compareRound(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return nb - na;
  if (Number.isFinite(na)) return -1;
  if (Number.isFinite(nb)) return 1;
  return String(a).localeCompare(String(b), "cs");
}

function groupByRound(matchList) {
  const byRound = new Map();
  for (const match of matchList) {
    if (!match.round) continue;
    if (!byRound.has(match.round)) byRound.set(match.round, []);
    byRound.get(match.round).push(match);
  }
  return [...byRound.entries()]
    .sort(([a], [b]) => compareRound(a, b))
    .map(([round, list]) => ({
      round,
      list: list.sort((x, y) => String(x.time ?? "").localeCompare(String(y.time ?? ""))),
    }));
}

// Termín kola: jeden den, nebo rozsah od prvního do posledního zápasu (odložené zápasy).
function RoundDates({ list }) {
  const timeList = list.map((m) => m.time).filter(Boolean);
  if (!timeList.length) return null;
  const first = timeList[0];
  const last = timeList[timeList.length - 1];
  const sameDay = first.slice(0, 10) === last.slice(0, 10);
  return (
    <Uu5Elements.Text
      category="interface"
      segment="content"
      type="medium"
      className={Config.Css.css({ color: theme.color.mutedFg })}
    >
      <DateText value={first} type="date" />
      {sameDay ? null : (
        <>
          {" – "}
          <DateText value={last} type="date" />
        </>
      )}
    </Uu5Elements.Text>
  );
}

const Season = createVisualComponent({
  uu5Tag: Config.TAG + "Season",

  render() {
    const [route] = useRoute();
    const { id: seasonId, kolo } = route?.params ?? {};
    const { getTeam, getCategory } = useApp();

    const dataObject = useDataObject(
      {
        handlerMap: {
          load: async () => {
            if (!seasonId) return null;
            const [season, tableRes, matchRes] = await Promise.all([
              UiElements.Call.cmdGet("/season/get", { id: seasonId }),
              UiElements.Call.cmdGet("/stats/getTable", { seasonId }).catch(() => null),
              UiElements.Call.cmdGet("/match/list", { seasonId, order: "asc" }),
            ]);
            return { season, table: tableRes?.table ?? [], matchList: matchRes?.itemList ?? [] };
          },
        },
      },
      [seasonId],
    );

    const { state, data } = dataObject;
    const season = data?.season;
    const roundList = useMemo(() => groupByRound(data?.matchList ?? []), [data]);

    // Naše týmy v soutěži: zvýraznění v tabulce a pohled, ze kterého dlaždice ukazuje výhru/prohru.
    const ownTeamIdList = useMemo(
      () => (season?.teamList ?? []).filter((teamId) => getTeam(teamId)?.own),
      [season, getTeam],
    );
    const ownTeamOf = (match) => ownTeamIdList.find((id) => id === match.homeTeamId || id === match.guestTeamId);

    // Soutěž bez tabulky (kategorie s `hasTable: false`, např. stará garda) tabulku nemá ani tady.
    const hasTable = ownTeamIdList.every((id) => getCategory(getTeam(id)?.category)?.hasTable !== false);

    usePageTitle({
      title: season ? `${season.competition} ${seasonLabel(season)}` : null,
      description: season ? `Tabulka a všechna kola soutěže ${season.competition} ${seasonLabel(season)}.` : undefined,
    });

    // Odrolovat na kolo z adresy, až jsou kola vykreslená.
    useEffect(() => {
      if (!kolo || !roundList.length) return;
      document.getElementById(roundAnchor(kolo))?.scrollIntoView({ block: "start" });
    }, [kolo, roundList.length]);

    if (!seasonId || state === "error" || (state === "ready" && !season)) {
      return (
        <Section>
          <EmptyState lsi={lsi("season", "missing")} icon="uugds-calendar" />
        </Section>
      );
    }

    if (!season) {
      return (
        <Section>
          <Uu5Elements.Skeleton height={320} />
        </Section>
      );
    }

    return (
      <>
        <Section>
          <Heading eyebrow={lsi("season", "eyebrow")}>
            {season.competition} {seasonLabel(season)}
          </Heading>

          {hasTable && data.table.length ? (
            <div className={Config.Css.css({ marginBlockStart: 24 })}>
              <StandingsTable
                table={data.table}
                ownTeamIdList={ownTeamIdList}
                hasPenalties={Boolean(season.hasPenalties)}
                seasonId={seasonId}
              />
            </div>
          ) : null}
        </Section>

        <Section variant="hatched">
          <Heading lsi={lsi("season", "rounds")} />
          {roundList.length === 0 ? (
            <div className={Config.Css.css({ marginBlockStart: 24 })}>
              <EmptyState lsi={lsi("season", "noMatches")} icon="uugds-calendar" />
            </div>
          ) : (
            roundList.map(({ round, list }) => (
              <section
                key={round}
                id={roundAnchor(round)}
                className={Config.Css.css({ marginBlockStart: 32, scrollMarginBlockStart: 96 })}
              >
                <div
                  className={Config.Css.css({
                    display: "flex",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "4px 16px",
                    marginBlockEnd: 12,
                  })}
                >
                  <Heading level={3}>
                    <Lsi import={importLsi} path={["match", "round"]} params={{ round }} />
                  </Heading>
                  <RoundDates list={list} />
                </div>
                <Uu5Elements.Grid templateColumns="repeat(auto-fill, minmax(280px, 1fr))">
                  {list.map((match) => (
                    <MatchTile key={match.id} match={match} ownTeamId={ownTeamOf(match)} />
                  ))}
                </Uu5Elements.Grid>
              </section>
            ))
          )}
        </Section>
      </>
    );
  },
});

export default Season;
