import { useDataObject, useEffect } from "uu5g05";
import GameCalls from "../calls/game-calls";
import GameContext from "../contexts/game-context";

function GameProvider({ children }) {
  const gameDto = useDataObject({
    skipInitialLoad: true,
    handlerMap: {
      init: GameCalls.init,
      get: (data) => GameCalls.get({ id: gameDto.data?.id, ...data }),
      set: (data) => GameCalls.set({ id: gameDto.data.id, ...data }),
      setHunter: (hunterId) => {
        // console.log("setHunter", { ...gameDto.data, hunterId });
        // gameDto.handlerMap.setData({ ...gameDto.data, hunterId });
        // TODO do it sync in selecting in visual
        return GameCalls.setHunter({ id: gameDto.data.id, hunterId });
      },
      destroy: () => gameDto?.data?.id && GameCalls.destroy({ id: gameDto.data.id }),
    },
  });

  useEffect(() => {
    return () => gameDto.handlerMap.destroy();
  }, []);

  return (
    <GameContext.Provider value={gameDto}>
      {children}
    </GameContext.Provider>
  );
}

export default GameProvider;
