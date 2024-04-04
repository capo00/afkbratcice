//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";

//@@viewOff:imports

const Amount = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Amount",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    return <Uu5Elements.Number currency="CZK" maxDecimalDigits={0} {...props} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Amount };
export default Amount;
//@@viewOff:exports
