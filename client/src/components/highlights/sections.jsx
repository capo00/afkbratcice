import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import Heading from "../layout/heading.jsx";
import Card from "../layout/card.jsx";
import RouteLink from "../route-link.jsx";
import { seasonName, seasonYears } from "../../core/season-label.js";
import {
  GRID,
  Block,
  StatCard,
  RecordCard,
  RankTable,
  Abbr,
  PlayerLink,
  MatchLink,
  ResultBadge,
  CardIcon,
  SmallText,
  usePair,
  useHighlightsContext,
} from "./parts.jsx";
import {
  fill,
  plural,
  num,
  percent,
  perMatch,
  formatDate,
  formatRange,
  formatScore,
  halfScore,
  signed,
  pointsPerMatch,
} from "./format.js";

// Sekce stránky Zajímavosti v pořadí, jak jdou pod sebou. Data jsou z `stats/getHighlights`
// (server/services/highlights.js): hráči jsou `playerId`, zápasy mají týmy jako id a jména
// i sezóny se dohledávají v číselnících odpovědi (`parts.jsx` HighlightsProvider).

const Css = Config.Css.css;

const wdl = (text, b) => fill(text.wdl, { wins: b.wins, draws: b.draws, losses: b.losses });
const matchScore = (match) => formatScore(match.homeGoals, match.guestGoals);

export function Balance() {
  const { data, text } = useHighlightsContext();
  const { total, home, away } = data.highlights;
  const t = text.balance ?? {};
  const points = total.wins * 3 + total.draws;

  return (
    <Block variant="hatched" eyebrow={lsi("highlights", "balance", "eyebrow")} title={t.header}>
      <Uu5Elements.Grid templateColumns={GRID.kpi} className={Css({ textAlign: "center" })}>
        <StatCard
          value={total.played}
          label={t.played}
          detail={[plural(text.count?.wins, total.wins), plural(text.count?.draws, total.draws), plural(text.count?.losses, total.losses)].join(" · ")}
        />
        <StatCard value={`${percent(total.wins, total.played)} %`} label={t.winPct} detail={plural(text.count?.fromMatches, total.played)} />
        <StatCard
          value={formatScore(total.goalsFor, total.goalsAgainst)}
          label={t.score}
          detail={fill(t.scoreDetail, { diff: signed(total.goalsFor - total.goalsAgainst) })}
        />
        <StatCard value={pointsPerMatch(total)} label={t.pointsPerMatch} detail={plural(text.count?.points, points)} />
      </Uu5Elements.Grid>
      <Uu5Elements.Grid templateColumns={GRID.pair}>
        {[
          ["home", t.home, "uugds-home", home],
          ["away", t.away, "uugdsstencil-transport-car", away],
        ].map(([key, title, icon, b]) => (
          <Card
            key={key}
            header={
              <div className={Css({ display: "flex", alignItems: "center", gap: 8 })}>
                <Uu5Elements.Icon icon={icon} colorScheme="primary" elementAttrs={{ "aria-hidden": true }} />
                <Heading level={3}>{title}</Heading>
              </div>
            }
          >
            <Uu5Elements.InfoGroup
              direction="horizontal"
              size="l"
              itemList={[
                { title: `${percent(b.wins, b.played)} %`, subtitle: t.winPct },
                { title: pointsPerMatch(b), subtitle: t.pointsPerMatch },
                { title: formatScore(b.goalsFor, b.goalsAgainst), subtitle: t.score },
              ]}
            />
            <SmallText className={Css({ marginBlockStart: 12 })}>
              {plural(text.count?.matches, b.played)} · {wdl(text, b)}
            </SmallText>
          </Card>
        ))}
      </Uu5Elements.Grid>
    </Block>
  );
}

export function FormAndStreaks() {
  const { data, text } = useHighlightsContext();
  const pair = usePair();
  const { current, streaks, ironMan } = data.highlights;
  const t = text.form ?? {};
  const matches = (n) => plural(text.count?.matches, n);
  const unit = (n) => plural(text.count?.matchesUnit, n);

  // Běžící série: výhry, jinak aspoň bez porážky; góly; a varování, když se dlouho nevyhrálo.
  const runningList = [
    current.wins >= 2
      ? { title: matches(current.wins), subtitle: fill(t.runWins, { record: streaks.wins?.length }) }
      : current.unbeaten >= 2
        ? { title: matches(current.unbeaten), subtitle: fill(t.runUnbeaten, { record: streaks.unbeaten?.length }) }
        : null,
    current.scoring >= 2 ? { title: matches(current.scoring), subtitle: fill(t.runScoring, { record: streaks.scoring?.length }) } : null,
    current.winless >= 3 ? { title: matches(current.winless), subtitle: t.runWinless } : null,
  ].filter(Boolean);

  const recordList = [
    ["unbeaten", t.unbeaten],
    ["wins", t.wins],
    ["scoring", t.scoring],
  ].filter(([key]) => streaks[key]);

  return (
    <Block variant="plain" eyebrow={lsi("highlights", "form", "eyebrow")} title={t.header}>
      <Card topStripe header={<Heading level={3}>{t.current}</Heading>}>
        <Uu5Elements.Grid templateColumns={GRID.pair}>
          <div>
            <div className={Css({ display: "flex", gap: 8, flexWrap: "wrap" })}>
              {current.lastList.map(({ result, match }) => {
                const label = `${text.result?.[result]?.word} ${matchScore(match)}, ${pair(match)}, ${formatDate(match.time)}`;
                return (
                  <RouteLink
                    key={match.id}
                    route="zapas"
                    params={{ id: match.id }}
                    elementAttrs={{ "aria-label": label, title: label }}
                    className={Css({
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      minInlineSize: 44,
                      minBlockSize: 44,
                      textDecoration: "none",
                    })}
                  >
                    <ResultBadge result={result} />
                    <Uu5Elements.Text category="interface" segment="content" type="small">
                      {matchScore(match)}
                    </Uu5Elements.Text>
                  </RouteLink>
                );
              })}
            </div>
            <SmallText className={Css({ marginBlockStart: 8 })}>{t.lastHint}</SmallText>
          </div>
          {runningList.length ? (
            <Uu5Elements.InfoGroup direction="vertical" size="l" itemList={runningList} />
          ) : (
            <SmallText>{t.noRun}</SmallText>
          )}
        </Uu5Elements.Grid>
      </Card>

      <div>
        <Heading level={3}>{t.longest}</Heading>
        <Uu5Elements.Grid templateColumns={GRID.cards} className={Css({ marginBlockStart: 12 })}>
          {recordList.map(([key, label]) => (
            <RecordCard key={key} label={label} value={streaks[key].length} unit={unit(streaks[key].length)} note={formatRange(streaks[key])} />
          ))}
          {ironMan ? (
            <RecordCard
              label={t.ironMan}
              value={ironMan.length}
              unit={plural(text.count?.inRowUnit, ironMan.length)}
              link={<PlayerLink playerId={ironMan.playerId} />}
              note={`${formatRange(ironMan)} · ${t.ironManHint}`}
            />
          ) : null}
        </Uu5Elements.Grid>
      </div>
    </Block>
  );
}

function SeasonLink({ seasonId }) {
  const { season } = useHighlightsContext();
  const value = season(seasonId);
  if (!value) return null;
  return (
    <RouteLink route="sezona" params={{ id: seasonId }}>
      {seasonName(value)}
    </RouteLink>
  );
}

export function Records() {
  const { data, text } = useHighlightsContext();
  const { biggestWin, biggestLoss, bestSeason, worstSeason, mostGoalsSeason, halfTime } = data.highlights;
  const t = text.records ?? {};
  const matchNote = (match) => [formatDate(match.time), halfScore(match) && fill(t.halfScore, { score: halfScore(match) })].filter(Boolean).join(" · ");
  const seasonNote = (row, extra) =>
    [fill(t.seasonNote, { wdl: wdl(text, row), score: formatScore(row.goalsFor, row.goalsAgainst) }), extra].filter(Boolean).join(" · ");
  const sameGoalsSeason = mostGoalsSeason && bestSeason && mostGoalsSeason.seasonId === bestSeason.seasonId;
  const comeback = halfTime.bestComeback;

  return (
    <Block variant="hatched" eyebrow={lsi("highlights", "records", "eyebrow")} title={t.header}>
      <div>
        <Uu5Elements.Grid templateColumns={GRID.cards}>
          {biggestWin ? (
            <RecordCard label={t.biggestWin} value={matchScore(biggestWin)} link={<MatchLink match={biggestWin} />} note={matchNote(biggestWin)} />
          ) : null}
          {biggestLoss ? (
            <RecordCard label={t.biggestLoss} value={matchScore(biggestLoss)} link={<MatchLink match={biggestLoss} />} note={matchNote(biggestLoss)} />
          ) : null}
          {bestSeason ? (
            <RecordCard
              label={t.bestSeason}
              value={num(bestSeason.pointsPerMatch)}
              unit={t.pointsPerMatchUnit}
              link={<SeasonLink seasonId={bestSeason.seasonId} />}
              note={seasonNote(bestSeason, sameGoalsSeason ? t.mostGoalsNote : null)}
            />
          ) : null}
          {worstSeason ? (
            <RecordCard
              label={t.worstSeason}
              value={num(worstSeason.pointsPerMatch)}
              unit={t.pointsPerMatchUnit}
              link={<SeasonLink seasonId={worstSeason.seasonId} />}
              note={seasonNote(worstSeason)}
            />
          ) : null}
          {mostGoalsSeason && !sameGoalsSeason ? (
            <RecordCard
              label={t.mostGoalsSeason}
              value={mostGoalsSeason.goalsFor}
              unit={t.goalsUnit}
              link={<SeasonLink seasonId={mostGoalsSeason.seasonId} />}
              note={seasonNote(mostGoalsSeason)}
            />
          ) : null}
        </Uu5Elements.Grid>
        {bestSeason ? <SmallText className={Css({ marginBlockStart: 8 })}>{fill(t.seasonsHint, { min: data.highlights.rules.minSeasonMatches })}</SmallText> : null}
      </div>

      {halfTime.matches ? (
        <div>
          <Heading level={3}>{t.halfTime}</Heading>
          <Uu5Elements.Grid templateColumns={GRID.cards} className={Css({ marginBlockStart: 12 })}>
            <RecordCard
              label={t.comebacks}
              value={halfTime.comebacks}
              unit={plural(text.count?.winsUnit, halfTime.comebacks)}
              note={fill(t.comebacksNote, { behind: halfTime.behind, draws: halfTime.comebackDraws })}
            />
            {halfTime.ahead ? (
              <RecordCard
                label={t.ahead}
                value={`${percent(halfTime.aheadWins, halfTime.ahead)} %`}
                note={fill(t.aheadNote, { wins: halfTime.aheadWins, ahead: halfTime.ahead })}
              />
            ) : null}
            {comeback ? (
              <RecordCard
                label={t.bestComeback}
                value={matchScore(comeback)}
                link={<MatchLink match={comeback} />}
                note={fill(t.bestComebackNote, { score: halfScore(comeback), date: formatDate(comeback.time) })}
              />
            ) : null}
          </Uu5Elements.Grid>
        </div>
      ) : null}
    </Block>
  );
}

function usePlayerColumns() {
  const { text } = useHighlightsContext();
  const col = text.col ?? {};
  const perMatchColumn = (key) => ({
    key: `${key}PerMatch`,
    label: <Abbr title={text.perMatch?.[key]}>{text.perMatch?.label}</Abbr>,
    numeric: true,
    render: (row) => perMatch(row[key], row.appearances),
  });
  return {
    player: { key: "playerId", label: col.player, render: (row) => <PlayerLink playerId={row.playerId} /> },
    appearances: { key: "appearances", label: col.appearances, numeric: true },
    goals: { key: "goals", label: col.goals, numeric: true },
    perMatch: perMatchColumn,
  };
}

export function HallOfFame() {
  const { data, text, season } = useHighlightsContext();
  const { club100, topScorers, kingList } = data.highlights;
  const t = text.fame ?? {};
  const c = usePlayerColumns();

  return (
    <Block variant="plain" eyebrow={lsi("highlights", "fame", "eyebrow")} title={t.header}>
      <Uu5Elements.Grid templateColumns={GRID.ranks} alignItems="start">
        {club100.length ? (
          <RankTable
            title={t.club100}
            hint={fill(t.club100Hint, { count: data.highlights.rules.clubAppearances })}
            sortKey="appearances"
            rowList={club100}
            columnList={[c.player, c.appearances, c.goals]}
          />
        ) : null}
        {topScorers.length ? (
          <RankTable
            title={t.topScorers}
            hint={t.topScorersHint}
            sortKey="goals"
            rowList={topScorers}
            columnList={[c.player, c.goals, c.appearances, c.perMatch("goals")]}
          />
        ) : null}
        {kingList.length ? (
          <RankTable
            title={t.kings}
            hint={t.kingsHint}
            rank={false}
            sortKey="goals"
            rowList={kingList.map((king) => ({ ...king, key: king.seasonId }))}
            columnList={[
              {
                key: "seasonId",
                label: t.season,
                render: (king) => (
                  <span className={Css({ display: "inline-flex", gap: 8, alignItems: "center" })}>
                    <RouteLink route="sezona" params={{ id: king.seasonId }}>
                      {seasonYears(season(king.seasonId))}
                    </RouteLink>
                    {king.current ? (
                      <Uu5Elements.Badge size="m" colorScheme="building" significance="common">
                        {t.ongoing}
                      </Uu5Elements.Badge>
                    ) : null}
                  </span>
                ),
              },
              {
                key: "playerIdList",
                label: text.col?.player,
                wrap: true,
                render: (king) =>
                  king.playerIdList.map((playerId, i) => (
                    <span key={playerId}>
                      {i ? ", " : ""}
                      <PlayerLink playerId={playerId} />
                    </span>
                  )),
              },
              c.goals,
            ]}
          />
        ) : null}
      </Uu5Elements.Grid>
    </Block>
  );
}

export function PlayerRanks() {
  const { data, text } = useHighlightsContext();
  const { total, winWith, goalkeepers, cleanSheetStreak, yellowCards, redCards } = data.highlights;
  const t = text.players ?? {};
  const c = usePlayerColumns();
  if (!winWith.length && !goalkeepers.length && !yellowCards.length && !redCards.length) return null;

  return (
    <Block variant="hatched" eyebrow={lsi("highlights", "players", "eyebrow")} title={t.header}>
      <Uu5Elements.Grid templateColumns={GRID.ranks} alignItems="start">
        {winWith.length ? (
          <RankTable
            title={t.winWith}
            hint={fill(t.winWithHint, { min: data.highlights.rules.minWinWithAppearances, pct: percent(total.wins, total.played) })}
            sortKey="winPct"
            rowList={winWith.map((row) => ({ ...row, winPct: percent(row.wins, row.appearances) }))}
            columnList={[c.player, { key: "winPct", label: t.winsCol, numeric: true, render: (row) => `${row.winPct} %` }, c.appearances]}
          />
        ) : null}
        {goalkeepers.length ? (
          <RankTable
            title={t.goalkeepers}
            hint={fill(t.goalkeepersHint, { min: data.highlights.rules.minGoalkeeperStarts })}
            sortKey="cleanSheets"
            rowList={goalkeepers}
            columnList={[
              { ...c.player, label: t.goalkeeper },
              { key: "cleanSheets", label: t.cleanSheets, numeric: true },
              { key: "goalkeeperStarts", label: <Abbr title={t.goalkeeperStartsTitle}>{t.goalkeeperStarts}</Abbr>, numeric: true },
            ]}
            after={
              cleanSheetStreak?.length >= 2 ? (
                <SmallText className={Css({ marginBlockStart: 8 })}>
                  {t.cleanSheetStreak} <PlayerLink playerId={cleanSheetStreak.playerId} />,{" "}
                  {fill(t.cleanSheetStreakNote, {
                    matches: plural(text.count?.matches, cleanSheetStreak.length),
                    from: formatDate(cleanSheetStreak.from),
                    to: formatDate(cleanSheetStreak.to),
                  })}
                </SmallText>
              ) : null
            }
          />
        ) : null}
        {yellowCards.length ? (
          <RankTable
            title={t.yellowCards}
            icon={<CardIcon color="yellow" />}
            sortKey="yellowCards"
            rowList={yellowCards}
            columnList={[c.player, { key: "yellowCards", label: t.yellowCol, numeric: true }, c.appearances, c.perMatch("yellowCards")]}
          />
        ) : null}
        {redCards.length ? (
          <RankTable
            title={t.redCards}
            icon={<CardIcon color="red" />}
            sortKey="redCards"
            rowList={redCards}
            columnList={[c.player, { key: "redCards", label: t.redCol, numeric: true }, c.appearances, c.perMatch("redCards")]}
          />
        ) : null}
      </Uu5Elements.Grid>
    </Block>
  );
}
