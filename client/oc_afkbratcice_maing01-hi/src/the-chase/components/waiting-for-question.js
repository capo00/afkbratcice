import { useEffect, useUveVisibility } from "uu5g05";
import { useRound2 } from "../contexts/round2-context";
import { usePlayer } from "../contexts/player-context";

function WaitingForQuestion() {
  const { data: player } = usePlayer();
  const { data: round2, handlerMap } = useRound2();
  const visible = useUveVisibility();

  useEffect(() => {
    const interval = setInterval(() => {
      visible && (round2 ? handlerMap.get() : handlerMap.load({ playerId: player.id }));
      console.log("WaitingForQuestion interval");
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div>
      <h3>Připravte se na otázku!</h3>
    </div>
  );
}

export default WaitingForQuestion;
