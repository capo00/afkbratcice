//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config";
import TheChaseProvider from "../providers/the-chase-provider";
import Welcome from "./game/welcome";
import Init from "./game/init";
import Round1 from "./game/round1";
import Round2 from "./game/round2";
import Round3 from "./game/round3";
import Final from "./game/final";
import { useGame } from "../contexts/game-context";
import QuitButton from "./game/quit-button";
//@@viewOff:imports

const Game = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Game",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { id } = props;

    const [type, setType] = useState(id ? "init" : "welcome");
    const [winner, setWinner] = useState();
    const [sum, setSum] = useState();
    //@@viewOff:private

    let result;
    switch (type) {
      case "welcome":
        result = <Welcome onConfirm={() => setType("init")} />;
        break;
      case "init":
        result = <Init id={id} onConfirm={() => setType("round1")} />;
        break;
      case "round1":
        result = <Round1 onConfirm={() => setType("round2")} />;
        break;
      case "round2":
        result = <Round2 onConfirm={() => setType("round3")} />;
        break;
      case "round3":
        result = (
          <Round3
            onConfirm={({ winner, sum }) => {
              setWinner(winner);
              setSum(sum);
              setType("final");
            }}
          />
        );
        break;
      case "final":
        result = <Final winner={winner} sum={sum} />;
        break;
      default:
        result = <h2>Neznámý typ: {type}</h2>;
    }

    //@@viewOn:render
    return (
      <TheChaseProvider>
        <QuitButton significance="subdued" icon="uugds-close" style={{ position: "fixed", top: 8, right: 8 }} />
        {result}
      </TheChaseProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Game };
export default Game;
//@@viewOff:exports
