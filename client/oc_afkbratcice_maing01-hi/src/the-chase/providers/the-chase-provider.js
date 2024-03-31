import GameProvider from "./game-provider";
import PlayerListProvider from "./player-list-provider";
import Round2Provider from "./round2-provider";

function TheChaseProvider({ children }) {
  return (
    <GameProvider>
      <PlayerListProvider>
        <Round2Provider>
          {children}
        </Round2Provider>
      </PlayerListProvider>
    </GameProvider>
  );
}

export default TheChaseProvider;
