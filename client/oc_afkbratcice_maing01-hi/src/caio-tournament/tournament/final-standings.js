import { createVisualComponent, Lsi, useScreenSize } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../components/config/config.js";
import { useParticipantList } from "../participant/participant-context.js";
import Uu5TilesElements from "uu5tilesg02-elements";
import { useTournament } from "./tournament-context.js";

const POSITION_MAP = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function cellComponent(isSmall, alignment) {
  return <Uu5TilesElements.Table.Cell horizontalAlignment={alignment} style={isSmall ? undefined : { fontSize: "2em" }} />
}

const FinalStandings = createVisualComponent({
  uu5Tag: Config.TAG + "FinalStandings",

  render(props) {
    const { tournamentId, ...restProps } = props;

    const [screenSize] = useScreenSize();
    const isSmall = screenSize === "xs";

    const tournamentDto = useTournament();

    const participantList = useParticipantList();
    const participantMap = {};
    (participantList?.data ?? []).forEach((p) => {
      participantMap[p.data?.id] = p.data;
    });

    return tournamentDto.data?.finalStandingList?.length > 0 && (
      <Uu5Elements.Block
        {...restProps}
        // header={<Lsi lsi={{ cs: "Celkové umístění" }} />}
        // headerType="title"
        card="full"
      >
        <Uu5TilesElements.Table
          data={tournamentDto.data.finalStandingList}
          columnList={[
            {
              value: "position",
              header: "#",
              cell: ({ data }) => POSITION_MAP[data.position] ?? (data.position + "."),
              cellComponent: cellComponent(isSmall, "right"),
              minWidth: "max-content",
              maxWidth: "max-content",
            },
            {
              value: "name",
              header: <Lsi lsi={{ cs: "Název" }} />,
              cell: ({ data }) => data.position > 3 ? participantMap[data.participantId]?.name : <b>{participantMap[data.participantId]?.name}</b>,
              cellComponent: cellComponent(isSmall),
            },
            {
              value: "playerList",
              header: <Lsi lsi={{ cs: "Hráči" }} />,
              cell: ({ data }) => participantMap[data.participantId]?.playerList?.map((p) => p.name).join(", "),
            },
          ]}
          hideHeader
          spacing="loose"
          verticalAlignment="center"
          disableColumnResize
        />
      </Uu5Elements.Block>
    );
  },
});

export { FinalStandings };
export default FinalStandings;
