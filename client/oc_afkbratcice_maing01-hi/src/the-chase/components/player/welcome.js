import { useEffect, useUveVisibility } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
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
    <>
      <Uu5Elements.Text category="interface" segment="title" type="major">
        {player?.name}, vítejte ve hře
      </Uu5Elements.Text>
      <Uu5Elements.Text category="interface" segment="title" type="main">
        Na lovu
      </Uu5Elements.Text>
      <Uu5Elements.Text category="interface" segment="title" type="major">
        Vyčkejte, až budete na řadě!
      </Uu5Elements.Text>
    </>
  );
}

export default Welcome;
