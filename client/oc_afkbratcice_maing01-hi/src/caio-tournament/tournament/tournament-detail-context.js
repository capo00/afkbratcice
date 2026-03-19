import { createComponent, useDataObject, Utils } from "uu5g05";
import Config from "./config/config.js";
import { Call } from "../../libs/oc_cli-elements/call.js";

const [TournamentCtx, useTournamentDetail] = Utils.Context.create();

const TournamentDetailProvider = createComponent({
  uu5Tag: Config.TAG + "TournamentDetailProvider",

  render(props) {
    const { id, children } = props;

    const dto = useDataObject({
      handlerMap: {
        load: () => Call.cmdGet("caio-tournament/tournament/get", { id }),
        update: (dtoIn) => Call.cmdPost("caio-tournament/tournament/update", { ...dtoIn, id }),
        generateMatches: () => Call.cmdPost("caio-tournament/tournament/generateMatches", { tournamentId: id }),
        generatePlayoff: () => Call.cmdPost("caio-tournament/tournament/generatePlayoff", { tournamentId: id }),
        evaluate: () => Call.cmdPost("caio-tournament/tournament/evaluate", { tournamentId: id }),
        close: () => Call.cmdPost("caio-tournament/tournament/close", { tournamentId: id }),
      },
    });

    return (
      <TournamentCtx.Provider value={dto}>
        {children}
      </TournamentCtx.Provider>
    );
  },
});

export { TournamentDetailProvider, useTournamentDetail };
