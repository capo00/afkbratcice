import { useDataObject, useEffect } from "uu5g05";
import PlayerCalls from "../calls/player-calls";
import PlayerContext from "../contexts/player-context";

function PlayerProvider({ gameId, id, children }) {
  const playerDto = useDataObject({
    skipInitialLoad: true,
    handlerMap: {
      create: (dtoIn) => PlayerCalls.create({ gameId, ...dtoIn }),
      get: (id) => PlayerCalls.get({ gameId, id: id ?? playerDto.data.id }),
      set: (data) => PlayerCalls.set({ gameId, id: playerDto.data.id, ...data }),
    },
  });

  useEffect(() => {
    if (id) playerDto.handlerMap.get(id);
  }, [id]);

  return <PlayerContext.Provider value={playerDto}>{children}</PlayerContext.Provider>;
}

export default PlayerProvider;
