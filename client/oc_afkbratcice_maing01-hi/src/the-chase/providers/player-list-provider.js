import { useDataList, useMemo } from "uu5g05";
import PlayerCalls from "../calls/player-calls";
import PlayerListContext from "../contexts/player-list-context";
import { useGame } from "../contexts/game-context";

function PlayerListProvider({ children }) {
  const { data } = useGame();
  const gameId = data?.id;

  const playerListDto = useDataList({
    skipInitialLoad: true,
    handlerMap: {
      load: () => PlayerCalls.list({ gameId }),
    },
    itemHandlerMap: {
      get: (dtoIn) => PlayerCalls.get({ gameId, ...dtoIn }),
      set: (dtoIn) => PlayerCalls.set({ gameId, ...dtoIn }),
    },
  });

  const value = useMemo(() => {
    if (playerListDto.data) {
      let hunter;
      const playerList = playerListDto.data.filter((player) => {
        if (player.data.id === data?.hunterId) {
          hunter = player;
        } else {
          return true;
        }
      });

      return {
        ...playerListDto,
        data: { itemList: playerListDto.data, playerList, hunter },
      };
    } else {
      return playerListDto;
    }
  }, [playerListDto, data?.hunterId]);

  return <PlayerListContext.Provider value={value}>{children}</PlayerListContext.Provider>;
}

export default PlayerListProvider;
