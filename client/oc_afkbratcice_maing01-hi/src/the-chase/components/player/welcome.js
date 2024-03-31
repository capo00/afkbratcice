import { useEffect, useUveVisibility } from "uu5g05";
import { usePlayer } from "../../contexts/player-context";

function Welcome({ onConfirm }) {
  const visible = useUveVisibility();
  const { data: player, handlerMap } = usePlayer();

  useEffect(() => {
    const interval = setInterval(async () => {
      if (visible) {
        const player = await handlerMap.get();
        if (player.hunter != null) onConfirm();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  return (
    <div>
      <h1>{player.name}, vítejte ve hře Na lovu</h1>
      <h2>Vyčkejte, až budete na řadě!</h2>
    </div>
  );
}

export default Welcome;
