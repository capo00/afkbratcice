//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useApp } from "../core/app/app-context.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let Init = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Init",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { handlerMap } = useApp();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div>
        <Uu5Elements.Button onClick={() => handlerMap.init()}>Init</Uu5Elements.Button>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Init };
export default Init;
//@@viewOff:exports
