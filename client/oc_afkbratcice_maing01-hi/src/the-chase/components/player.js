//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config";
import PlayerProvider from "../providers/player-provider";
import AddPlayer from "./player/add-player";
import Welcome from "./player/welcome";
import Round2 from "./player/round2";
import { usePlayer } from "../contexts/player-context";
//@@viewOff:imports

function Bg({ children }) {
  const { data: player } = usePlayer();

  return (
    <Uu5Elements.Box
      shape="background"
      colorScheme={player?.hunter ? "red" : "blue"}
      significance="highlighted"
      className={Config.Css.css({ padding: 16, minHeight: "100vh" })}
    >
      {children}
    </Uu5Elements.Box>
  );
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
    const { gameId } = props;

    const [type, setType] = useState("addPlayer");
    //@@viewOff:private

    let result;
    switch (type) {
      case "addPlayer":
        result = <AddPlayer onConfirm={() => setType("welcome")} />;
        break;
      case "welcome":
        result = <Welcome onConfirm={() => setType("round2")} />;
        break;
      case "round2":
        result = <Round2 onConfirm={() => setType("final")} />;
        break;
      case "final":
        // result = <Final />;
        result = <h1>Final</h1>;
        break;
      default:
        result = <h2>Neznámý typ: {type}</h2>;
    }

    //@@viewOn:render
    return (
      <PlayerProvider gameId={gameId}>
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
