import { createVisualComponent, createComponent, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../components/config/config.js";
import MatchTable from "../match/match-table.js";
import GroupStandings from "./group-standings.js";
import { MatchListProvider, useMatchList } from "../match/match-context.js";
import { useParticipantList } from "../participant/participant-context.js";

function withCollapsible(Component) {
  const Comp = createComponent({
    uu5Tag: Config.TAG + "Collapsible",
    render(props) {
      const { tournamentId, isReferee, groupList, venueList, collapsed, ...restProps } = props;

      return collapsed ? (
        <Uu5Elements.Block {...restProps} header={<Lsi lsi={{ cs: "Skupiny" }} />} headerType="title" collapsible collapsed>
          <MatchListProvider tournamentId={tournamentId} phase="group">
            <Component tournamentId={tournamentId} isReferee={isReferee} groupList={groupList} venueList={venueList} />
          </MatchListProvider>
        </Uu5Elements.Block>
      ) : <Component {...props} />
    },
  });
  Utils.Component.mergeStatics(Comp, Component);
  return Comp;
}

let GroupMatchesSection = createVisualComponent({
  uu5Tag: Config.TAG + "GroupMatchesSection",

  render(props) {
    const { tournamentId, isReferee, groupList, venueList, ...restProps } = props;

    const matchList = useMatchList();
    const participantList = useParticipantList();

    function handleResultChange() {
      participantList.handlerMap.load?.();
    }

    const getChild = (venue, i) => {
      return (
        <Uu5Elements.Block
          key={venue}
          header={venue ? <Lsi lsi={{ cs: `Hřiště %s` }} params={venue} /> : <Lsi lsi={{ cs: "Zápasy ve skupinách" }} />}
          headerType="title"
          card="full"
        >
          <MatchTable
            isReferee={isReferee}
            itemList={venue && venueList.length === groupList.length && matchList.data ?
              matchList.data.filter((m) => m.data.group === groupList[i]) :
              matchList.data}
            onResultChange={handleResultChange}
          />
        </Uu5Elements.Block>
      );
    };

    return venueList.length > 1 ? (
      <>
        <Uu5Elements.Grid {...restProps} templateColumns="repeat(auto-fit, minmax(344px, 1fr))" columnGap={24}>
          {venueList.map(getChild)}
        </Uu5Elements.Grid>
        <Uu5Elements.Grid className={Config.Css.css({ marginBlockStart: 24 })} templateColumns="repeat(auto-fit, minmax(344px, 1fr))" columnGap={24}>
          {groupList.map((g) => (
            <GroupStandings key={g} group={g} matchList={matchList} />
          ))}
        </Uu5Elements.Grid>
      </>
    ) : (
      <Uu5Elements.Grid {...restProps} templateColumns={{ xs: "1fr", m: "1fr 1fr" }} columnGap={24}>
        {getChild()}
        <div className={Config.Css.css({ display: "flex", flexDirection: "column", gap: 24 })}>
          {groupList.map((g) => <GroupStandings key={g} group={g} matchList={matchList} />)}
        </div>
      </Uu5Elements.Grid>
    );
  },
});

GroupMatchesSection = withCollapsible(GroupMatchesSection);

export { GroupMatchesSection };
export default GroupMatchesSection;
