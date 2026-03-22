import { createComponent, useDataList, useEffect, Utils } from "uu5g05";
import OcElements from "../../libs/oc_cli-elements";
import { useTournament } from "../tournament/tournament-context";
import Config from "../components/config/config.js";

const [MatchListCtx, useMatchList] = Utils.Context.create({});

const MatchListProvider = createComponent({
  uu5Tag: Config.TAG + "MatchListProvider",

  render(props) {
    let { tournamentId, phase, children } = props;

    const tournamentDto = useTournament();

    phase ??= ["group", "playoff"].includes(tournamentDto.data?.state) ? tournamentDto.data?.state : null;

    const dataList = useDataList({
      skipInitialLoad: true,
      handlerMap: { load: (dtoIn) => OcElements.Call.cmdGet("caio-tournament/match/list", { tournamentId, ...dtoIn, phase }) },
      itemHandlerMap: { setResult: (dtoIn) => OcElements.Call.cmdPost("caio-tournament/match/setResult", dtoIn) },
    });

    useEffect(() => {
      if (phase) {
        dataList.handlerMap.load({ phase });
      }
    }, [phase]);

    return (
      <MatchListCtx.Provider value={dataList}>
        {children}
      </MatchListCtx.Provider>
    );
  },
});

export { MatchListProvider, useMatchList };
