//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config";
import PlayerProvider from "../providers/player-provider";
import Init from "./player/init";
import Welcome from "./player/welcome";
import Round2 from "./player/round2";
import { usePlayer } from "../contexts/player-context";
import Cover from "./cover";
//@@viewOff:imports

function Bg({ children }) {
  const { data: player } = usePlayer();
  return <Cover colorScheme={player?.hunter ? "red" : undefined}>{children}</Cover>;
}

const Player = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Player",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { gameId, id } = props;

    const [type, setType] = useState(id ? "welcome" : "init");
    //@@viewOff:private

    let result;
    switch (type) {
      case "init":
        result = <Init onConfirm={() => setType("welcome")} />;
        break;
      case "welcome":
        result = <Welcome onConfirm={() => setType("round2")} />;
        break;
      case "round2":
        result = <Round2 onConfirm={() => setType("final")} />;
        break;
      case "final":
        // result = <Final />;
        result = (
          <Uu5Elements.Text category="interface" segment="title" type="major">
            Pokračujte na hlavní obrazovce
          </Uu5Elements.Text>
        );
        break;
      default:
        result = <h2>Neznámý typ: {type}</h2>;
    }

    //@@viewOn:render
    return (
      <PlayerProvider gameId={gameId} id={id}>
        <Bg>{result}</Bg>
      </PlayerProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Player };
export default Player;
//@@viewOff:exports
