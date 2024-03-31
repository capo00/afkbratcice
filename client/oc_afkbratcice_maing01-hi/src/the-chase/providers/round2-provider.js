import { useDataObject } from "uu5g05";
import Round2Calls from "../calls/round2-calls";
import Round2Context from "../contexts/round2-context";
import { useGame } from "../contexts/game-context";

function Round2Provider({ gameId, children }) {
  const gameDto = useGame();
  gameId ??= gameDto?.data?.id;

  const round2Dto = useDataObject({
    skipInitialLoad: true,
    handlerMap: {
      init: (data) => Round2Calls.init({ gameId, ...data }),
      load: (data) => Round2Calls.load({ gameId, ...data }),
      get: () => Round2Calls.get({ gameId, id: round2Dto.data.id }),
      setOffer: (offer) => Round2Calls.setOffer({ gameId, id: round2Dto.data.id, offer }),
      confirmOffer: (amount) => Round2Calls.confirmOffer({ gameId, id: round2Dto.data.id, amount }),
      loadQuestion: () => Round2Calls.loadQuestion({ gameId, id: round2Dto.data.id }),
      setAnswer: (data) => Round2Calls.setAnswer({ gameId, id: round2Dto.data.id, ...data }),
    },
  });

  return <Round2Context.Provider value={round2Dto}>{children}</Round2Context.Provider>;
}

export default Round2Provider;
