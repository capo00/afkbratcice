//@@viewOn:imports
import { createVisualComponent, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

const Unauthorized = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Unauthorized",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    return (
      <Uu5Elements.Grid {...props} templateColumns="1fr" justifyItems="center">
        <Uu5Elements.PlaceholderBox code="permission" borderRadius="full" header="" info="" />
        <Uu5Elements.Text category="interface" segment="title" type="main">
          <Lsi lsi={{ cs: "Nemáte dostatečné oprávnění" }} />
        </Uu5Elements.Text>
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Unauthorized };
export default Unauthorized;
//@@viewOff:exports
