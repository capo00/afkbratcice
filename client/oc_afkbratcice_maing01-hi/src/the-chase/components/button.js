//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

const Button = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Button",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    return <Uu5Elements.Button size="xl" significance="highlighted" {...props} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Button };
export default Button;
//@@viewOff:exports
