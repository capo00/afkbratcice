//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import Game from "../the-chase/components/game";
import Player from "../the-chase/components/player";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TheChase = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TheChase",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { uu5Route, params } = props;
    //@@viewOff:private

    //@@viewOn:render
    return (
      <main className={Config.Css.css({ height: "100vh" })}>
        {params?.gameId ? <Player gameId={params.gameId} /> : <Game />}
      </main>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TheChase };
export default TheChase;
//@@viewOff:exports
