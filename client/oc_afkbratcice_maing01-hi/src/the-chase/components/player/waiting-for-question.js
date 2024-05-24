import { useEffect, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { useRound2 } from "../../contexts/round2-context";
import { usePlayer } from "../../contexts/player-context";

function WaitingForQuestion() {
  const { data: player } = usePlayer();
  const { data: round2, handlerMap } = useRound2();
  const visible = useUveVisibility();

  useEffect(() => {
    const interval = setInterval(() => {
      visible && (round2 ? handlerMap.get() : handlerMap.load({ playerId: player.id }));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <Uu5Elements.Text category="interface" segment="title" type="major">
      Připravte se na otázku!
    </Uu5Elements.Text>
  );
}

export default WaitingForQuestion;
