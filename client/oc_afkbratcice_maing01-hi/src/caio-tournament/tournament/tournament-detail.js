import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import { ParticipantListProvider } from "../participant/participant-context.js";
import { MatchListProvider } from "../match/match-context.js";
import { TournamentProvider } from "./tournament-context.js";
import TournamentDetailView from "./tournament-detail-view.js";

function getCalls(tournamentId) {
  return {
    list: (dtoIn) => OcElements.Call.cmdGet("caio-tournament/participant/list", { tournamentId, ...dtoIn }),
    createItem: (dtoIn) => OcElements.Call.cmdPost("caio-tournament/participant/create", { tournamentId, ...dtoIn }),
    updateItem: (dtoIn) => OcElements.Call.cmdPost("caio-tournament/participant/update", { tournamentId, ...dtoIn }),
    deleteItem: (dtoIn) => OcElements.Call.cmdPost("caio-tournament/participant/delete", { tournamentId, ...dtoIn }),
    deleteMany: (dtoIn) => OcElements.Call.cmdPost("caio-tournament/participant/deleteMany", { tournamentId, ...dtoIn }), // TODO impl. on the server (either for tournament + createMany)
  };
}

const TournamentDetail = createVisualComponent({
  uu5Tag: Config.TAG + "TournamentDetail",

  render(props) {
    const { id } = props;

    return (
      <TournamentProvider id={id}>
        <ParticipantListProvider dtoIn={{ tournamentId: id }} calls={getCalls(id)}>
          <MatchListProvider tournamentId={id}>
            <TournamentDetailView id={id} />
          </MatchListProvider>
        </ParticipantListProvider>
      </TournamentProvider>
    );
  },
});

export { TournamentDetail };
export default TournamentDetail;
