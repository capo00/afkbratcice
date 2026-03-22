import { createVisualComponent, createComponent, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { MatchListProvider, useMatchList } from "../match/match-context.js";
import MatchTable from "../match/match-table.js";

const PHASE_LABELS = {
  quarter: { cs: "Čtvrtfinále" },
  semi: { cs: "Semifinále" },
  thirdPlace: { cs: "O 3. místo" },
  final: { cs: "Finále" },
};

function withCollapsible(Component) {
  const Comp = createComponent({
    uu5Tag: Config.TAG + "Collapsible",
    render(props) {
      const { tournamentId, isReferee, venueList, collapsed, ...restProps } = props;

      return collapsed ? (
        <Uu5Elements.Block {...restProps} header={<Lsi lsi={{ cs: "Playoff" }} />} headerType="title" collapsible collapsed>
          <MatchListProvider tournamentId={tournamentId} phase="playoff">
            <Component tournamentId={tournamentId} isReferee={isReferee} venueList={venueList} />
          </MatchListProvider>
        </Uu5Elements.Block>
      ) : <Component {...props} />
    },
  });
  Utils.Component.mergeStatics(Comp, Component);
  return Comp;
}

let PlayoffSection = createVisualComponent({
  uu5Tag: Config.TAG + "PlayoffSection",

  render(props) {
    const { tournamentId, isReferee, venueList, collapsed, ...restProps } = props;

    const matchList = useMatchList();

    const venueMatchList = Array.from({ length: venueList?.length || 1 }, () => ({}));
    matchList.data?.forEach((match, i) => {
      const idx = i % venueList.length;
      venueMatchList[idx][match.data.group] ??= [];
      venueMatchList[idx][match.data.group].push(match);
    });

    const gridProps = collapsed ? null : restProps;

    function handleResultChange() {
      matchList.handlerMap.load?.();
    }

    const getChild = (venue, i = 0) => {
      const content = (
        <>
          {["quarter", "semi", "thirdPlace", "final"].filter((phase) => venueMatchList[i]?.[phase]).map((phase, j) => (
            <Uu5Elements.Block
              className={venue && j > 0 ? Config.Css.css({ marginBlockStart: 24 }) : undefined}
              key={phase}
              header={<b className={Config.Css.css({ display: "block", textAlign: "center" })}>{PHASE_LABELS[phase] ? <Lsi lsi={PHASE_LABELS[phase]} /> : phase}</b>}
              card={venue ? undefined : "full"}
            >
              <MatchTable
                isReferee={isReferee}
                itemList={venueMatchList[i][phase]}
                disableRowCounter
                onResultChange={handleResultChange}
              />
            </Uu5Elements.Block>
          )).filter(Boolean)}
        </>
      );

      return venue ? (
        <Uu5Elements.Block
          key={venue}
          header={<Lsi lsi={{ cs: "Hřiště %s" }} params={venue} />}
          headerType="title"
          card="full"
        >
          {content}
        </Uu5Elements.Block>
      ) : (
        content
      );
    };

    return venueList.length > 1 ? (
      <Uu5Elements.Grid {...gridProps} templateColumns="repeat(auto-fit, minmax(344px, 1fr))" columnGap={24}>
        {venueList.map(getChild)}
      </Uu5Elements.Grid>
    ) : (
      <Uu5Elements.Grid {...gridProps} templateColumns="repeat(auto-fill, minmax(344px, 1fr))" columnGap={24}>
        {getChild()}
      </Uu5Elements.Grid>
    );
  },
});

PlayoffSection = withCollapsible(PlayoffSection);

export { PlayoffSection };
export default PlayoffSection;
