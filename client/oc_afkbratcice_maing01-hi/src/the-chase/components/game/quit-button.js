//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config.js";
import { useGame } from "../../contexts/game-context";

//@@viewOff:imports

const QuitButton = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "QuitButton",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const gameDto = useGame();

    //@@viewOn:render
    return gameDto?.data?.id ? (
      <Uu5Elements.Button
        onClick={() => {
          gameDto.handlerMap.destroy();
          location.href = location.href.replace(/[?][^?]*/, "");
        }}
        {...props}
      />
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { QuitButton };
export default QuitButton;
//@@viewOff:exports
