import { createVisualComponent, Lsi, useScreenSize } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../components/config/config.js";
import { useParticipantList } from "../participant/participant-context.js";
import Uu5TilesElements from "uu5tilesg02-elements";
import { useMatchList } from "../match/match-context.js";

function standingsSorter(statsGetter, h2h) {
  return (a, b) => {
    const sa = statsGetter(a);
    const sb = statsGetter(b);
    if ((sb.points || 0) !== (sa.points || 0)) return (sb.points || 0) - (sa.points || 0);
    const h = h2h(a, b);
    if (h !== 0) return h;
    const diffA = (sa.scored || 0) - (sa.conceded || 0);
    const diffB = (sb.scored || 0) - (sb.conceded || 0);
    if (diffB !== diffA) return diffB - diffA;
    return (sb.scored || 0) - (sa.scored || 0);
  };
}

function headToHeadComparator(matches) {
  return (aId, bId) => {
    for (const m of matches) {
      if (m.data.state !== "played") continue;
      const hId = m.data.homeParticipantId;
      const awId = m.data.awayParticipantId;
      if (hId === aId && awId === bId) {
        if (m.data.score.home > m.data.score.away) return -1;
        if (m.data.score.home < m.data.score.away) return 1;
        return 0;
      }
      if (hId === bId && awId === aId) {
        if (m.data.score.home > m.data.score.away) return 1;
        if (m.data.score.home < m.data.score.away) return -1;
        return 0;
      }
    }
    return 0;
  };
}

function headerComponent(alignment, tooltip) {
  return <Uu5TilesElements.Table.HeaderCell horizontalAlignment={alignment} style={{ padding: 8 }} elementAttrs={{ title: tooltip }} />
}

function cellComponent(alignment) {
  return <Uu5TilesElements.Table.Cell horizontalAlignment={alignment} style={{ padding: 8 }} />
}

const GroupStandings = createVisualComponent({
  uu5Tag: Config.TAG + "GroupStandings",

  render(props) {
    const { tournamentId, group, ...restProps } = props;

    const [screenSize] = useScreenSize();
    const isSmall = screenSize === "xs";
    
    const matchList = useMatchList();
    const participantList = useParticipantList();
    const groupParticipantList = participantList.data?.filter((p) => p.data.group === group)?.sort();

    let orderedParticipantList;
    if (groupParticipantList && matchList.data) {
      const h2h = headToHeadComparator(matchList.data.filter((m) => m.data.group === group));
      orderedParticipantList = groupParticipantList.toSorted(standingsSorter(
        (p) => p.data.stats || {},
        (a, b) => h2h(a.data.id, b.data.id),
      ));
    }

    return (
      <Uu5Elements.Block
        {...restProps}
        header={<Lsi lsi={{ cs: `Skupina ${group}` }} />}
        headerType="title"
        card="full"
      >
        <Uu5TilesElements.Table
          data={orderedParticipantList}
          columnList={[
            {
              value: "_",
              header: <b>#</b>,
              headerComponent: headerComponent("right", "Umístění"),
              cell: (_, { rowIndex }) => <b>{rowIndex + 1}.</b>,
              cellComponent: cellComponent("right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            {
              value: "name",
              header: <b><Lsi lsi={{ cs: "Název" }} /></b>,
              cell: ({ data }) => <b>{data.data.name}</b>,
              headerComponent: headerComponent(undefined, undefined),
              cellComponent: cellComponent(),
            },
            {
              value: "stats.played",
              header: <Lsi lsi={{ cs: "Z" }} />,
              headerComponent: headerComponent("right", "Zápasy"),
              cell: ({ data }) => data.data.stats.played ?? 0,
              cellComponent: cellComponent("right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            {
              value: "stats.wins",
              header: <Lsi lsi={{ cs: "V" }} />,
              headerComponent: headerComponent("right", "Výhry"),
              cell: ({ data }) => data.data.stats.wins ?? 0,
              cellComponent: cellComponent("right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            {
              value: "stats.draws",
              header: <Lsi lsi={{ cs: "R" }} />,
              headerComponent: headerComponent("right", "Remízy"),
              cell: ({ data }) => data.data.stats.draws ?? 0,
              cellComponent: cellComponent("right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            {
              value: "stats.looses",
              header: <Lsi lsi={{ cs: "P" }} />,
              headerComponent: headerComponent("right", "Prohry"),
              cell: ({ data }) => data.data.stats.looses ?? 0,
              cellComponent: cellComponent("right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            {
              value: "stats.scored",
              header: <Lsi lsi={{ cs: "Skóre" }} />,
              headerComponent: <Uu5TilesElements.Table.HeaderCell horizontalAlignment="center" style={{ paddingInline: 8, paddingBlock: 13, fontSize: 11 }} />,
              cell: ({ data }) => `${data.data.stats.scored ?? 0} : ${data.data.stats.conceded ?? 0}`,
              cellComponent: cellComponent("center"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            isSmall ? undefined : {
              value: "stats.scored-conceded",
              header: <Lsi lsi={{ cs: "+/-" }} />,
              headerComponent: headerComponent("center"),
              cell: ({ data }) => (data.data.stats.scored ?? 0) - (data.data.stats.conceded ?? 0),
              cellComponent: cellComponent("center"),
              minWidth: 40,
              maxWidth: 40,
            },
            {
              value: "stats.points",
              header: <b><Lsi lsi={{ cs: "B" }} /></b>,
              headerComponent: headerComponent("right", "Body"),
              cell: ({ data }) => <b>{data.data.stats.points ?? 0}</b>,
              cellComponent: cellComponent("right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
          ].filter(Boolean)}
          spacing="tight"
          verticalAlignment="center"
          disableColumnResize
          borderRadius="moderate"
        />
      </Uu5Elements.Block>
    );
  },
});

export { GroupStandings };
export default GroupStandings;
