import { usePlayer } from "../../contexts/player-context";
import Round2Provider from "../../providers/round2-provider";
import Round2Hunter from "./round2-hunter";
import Round2Player from "./round2-player";

function Round2({ onConfirm }) {
  const { data: player } = usePlayer();
  const Comp = player.hunter ? Round2Hunter : Round2Player;

  return (
    <Round2Provider gameId={player.gameId}>
      <Comp onConfirm={onConfirm} />
    </Round2Provider>
  );
}

export default Round2;
