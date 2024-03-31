import { useDataObject } from "uu5g05";
import PlayerCalls from "../calls/player-calls";
import PlayerContext from "../contexts/player-context";

function PlayerProvider({ gameId, children }) {
  const playerDto = useDataObject({
    skipInitialLoad: true,
    handlerMap: {
      create: (dtoIn) => PlayerCalls.create({ gameId, ...dtoIn }),
      get: () => PlayerCalls.get({ gameId, id: playerDto.data.id }),
      set: (data) => PlayerCalls.set({ gameId, id: playerDto.data.id, ...data }),
    },
  });

  return <PlayerContext.Provider value={playerDto}>{children}</PlayerContext.Provider>;
}

export default PlayerProvider;
