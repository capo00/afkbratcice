import { Utils, useLsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import importLsi from "../../lsi/import-lsi.js";
import Section from "../layout/section.jsx";
import Heading from "../layout/heading.jsx";
import Eyebrow from "../layout/eyebrow.jsx";
import Card from "../layout/card.jsx";
import DisplayText from "../layout/display-text.jsx";
import DataTable from "../data-table.jsx";
import RouteLink from "../route-link.jsx";
import { personName } from "../../core/person-name.js";
import { rankList } from "./format.js";

// Stavební díly stránky Zajímavosti (routes/zajimavosti.jsx): blok sekce, dlaždice čísla,
// karta rekordu, žebříček a odkazy na hráče a zápas. Podle specu designera k náhledu
// (Caio 2026-11-18).

const { theme } = Config;
const Css = Config.Css.css;

export const GRID = {
  kpi: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
  pair: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  cards: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  // Dva sloupce: střelci mají čtyři číselné sloupce a ve třetině šířky by se ořízli.
  ranks: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
};

export const mutedSmall = Css({ display: "block", color: theme.color.mutedFg });

// Data z `stats/getHighlights` a texty pro všechny sekce, ať se nemusí předávat přes každou.
const [HighlightsContext, useHighlightsContext] = Utils.Context.create();

/** Texty stránky (`highlights` v cs.json) a číselníky odpovědi. */
export function HighlightsProvider({ data, children }) {
  const text = useLsi(importLsi, ["highlights"]);
  const unnamedPlayer = useLsi(importLsi, ["team", "unnamedPlayer"]);
  const value = {
    data,
    text,
    playerLabel: (playerId) => personName(data.playerMap?.[playerId]?.person) || unnamedPlayer,
    teamName: (teamId) => data.teamMap?.[teamId]?.name ?? "?",
    season: (seasonId) => data.seasonMap?.[seasonId] ?? null,
  };
  return <HighlightsContext.Provider value={value}>{children}</HighlightsContext.Provider>;
}

export { useHighlightsContext };

export function SmallText({ children, className }) {
  return (
    <Uu5Elements.Text category="interface" segment="content" type="small" className={Config.Css.join(mutedSmall, className)}>
      {children}
    </Uu5Elements.Text>
  );
}

export function Block({ variant, eyebrow, title, children }) {
  return (
    <Section variant={variant}>
      <Heading eyebrow={eyebrow}>{title}</Heading>
      <Uu5Elements.Grid rowGap={32} className={Css({ marginBlockStart: 24 })}>
        {children}
      </Uu5Elements.Grid>
    </Section>
  );
}

/** Velké číslo bilance s popiskem. */
export function StatCard({ value, label, detail }) {
  return (
    <Card>
      <Uu5Elements.Text category="expose" segment="default" type="lead">
        {({ style }) => <div className={Css({ ...style, ...theme.typography.display, color: theme.color.clubRed })}>{value}</div>}
      </Uu5Elements.Text>
      <Eyebrow className={Css({ marginBlockStart: 8, marginBlockEnd: 0, textWrap: "balance" })}>{label}</Eyebrow>
      {detail ? <SmallText className={Css({ marginBlockStart: 4 })}>{detail}</SmallText> : null}
    </Card>
  );
}

/** Rekord: popisek, hodnota s jednotkou, odkaz a poznámka. */
export function RecordCard({ label, value, unit, link, note }) {
  return (
    <Card>
      <Uu5Elements.Grid rowGap={4}>
        <SmallText>{label}</SmallText>
        <div className={Css({ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" })}>
          <DisplayText type="broad">{value}</DisplayText>
          {unit ? (
            <Uu5Elements.Text category="interface" segment="content" type="medium">
              {unit}
            </Uu5Elements.Text>
          ) : null}
        </div>
        {link ? (
          <Uu5Elements.Text category="interface" segment="content" type="medium">
            {link}
          </Uu5Elements.Text>
        ) : null}
        {note ? <SmallText>{note}</SmallText> : null}
      </Uu5Elements.Grid>
    </Card>
  );
}

/** Zkratka v hlavičce s celým významem v tooltipu; čtečka přečte celý text. */
export function Abbr({ title, children }) {
  return (
    <abbr
      title={title}
      className={Css({ cursor: "help", textDecorationLine: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 })}
    >
      {children}
    </abbr>
  );
}

export function PlayerLink({ playerId }) {
  const { playerLabel } = useHighlightsContext();
  return (
    <RouteLink route="hrac" params={{ id: playerId }}>
      {playerLabel(playerId)}
    </RouteLink>
  );
}

/** „Potěhy – AFK Bratčice“ */
export function usePair() {
  const { teamName } = useHighlightsContext();
  return (match) => `${teamName(match.homeTeamId)} – ${teamName(match.guestTeamId)}`;
}

export function MatchLink({ match }) {
  const pair = usePair();
  return (
    <RouteLink route="zapas" params={{ id: match.id }}>
      {pair(match)}
    </RouteLink>
  );
}

const BADGE = {
  W: { colorScheme: "primary", significance: "highlighted" },
  D: { colorScheme: "building", significance: "common" },
  L: { colorScheme: "building", significance: "distinct" },
};

export function ResultBadge({ result, size = "l" }) {
  const { text } = useHighlightsContext();
  return (
    <Uu5Elements.Badge size={size} borderRadius="full" {...BADGE[result]}>
      {text.result?.[result]?.letter}
    </Uu5Elements.Badge>
  );
}

export function CardIcon({ color }) {
  return <Uu5Elements.Icon icon="uugdsstencil-shape-rectangle-vertical-solid" colorScheme={color} elementAttrs={{ "aria-hidden": true }} />;
}

/**
 * Žebříček. `columnList`: `{ key, label, numeric, wrap, render }`; první sloupec je hlavička
 * řádku. `sortKey` je tučně a podle něj se počítá pořadí se shodami.
 */
export function RankTable({ title, hint, icon, columnList, rowList, sortKey, rank = true, after }) {
  const { text } = useHighlightsContext();
  const ranks = rank ? rankList(rowList, sortKey) : [];
  return (
    <div>
      <div className={Css({ display: "flex", alignItems: "center", gap: 8 })}>
        {icon}
        <Heading level={3}>{title}</Heading>
      </div>
      {hint ? <SmallText className={Css({ marginBlockStart: 4, marginBlockEnd: 8 })}>{hint}</SmallText> : null}
      <DataTable>
        <thead>
          <DataTable.HeaderRow>
            {rank ? <DataTable.Th>{text.col?.rank}</DataTable.Th> : null}
            {columnList.map((column) => (
              <DataTable.Th key={column.key} align={column.numeric ? "center" : "start"}>
                {column.label}
              </DataTable.Th>
            ))}
          </DataTable.HeaderRow>
        </thead>
        <tbody>
          {rowList.map((row, i) => (
            <tr key={row.key ?? row.playerId ?? i}>
              {rank ? <DataTable.Td className={Css({ color: theme.color.mutedFg })}>{`${ranks[i]}.`}</DataTable.Td> : null}
              {columnList.map((column, ci) => {
                const content = column.render ? column.render(row) : row[column.key];
                const wrap = column.wrap ? { whiteSpace: "normal" } : null;
                return ci === 0 ? (
                  <DataTable.Th key={column.key} scope="row" className={Css({ fontWeight: 400, ...wrap })}>
                    {content}
                  </DataTable.Th>
                ) : (
                  <DataTable.Td
                    key={column.key}
                    align={column.numeric ? "center" : "start"}
                    className={Css({ ...(column.key === sortKey && { fontWeight: 700 }), ...wrap })}
                  >
                    {content}
                  </DataTable.Td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </DataTable>
      {after}
    </div>
  );
}
