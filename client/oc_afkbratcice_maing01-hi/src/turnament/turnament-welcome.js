//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TurnamentWelcome = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TurnamentWelcome",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return (
      <h2>Tento web slouží pro tvorbu turnajů</h2>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TurnamentWelcome };
export default TurnamentWelcome;
//@@viewOff:exports
