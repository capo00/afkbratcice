//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

const Cover = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Cover",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { children, colorScheme = "dark-blue" } = props;

    //@@viewOn:render
    const { elementProps } = Utils.VisualComponent.splitProps(
      props,
      Config.Css.css({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
        paddingTop: 40,
      }),
    );

    return (
      <Uu5Elements.Box shape="background" significance="highlighted" colorScheme={colorScheme} {...elementProps}>
        {children}
      </Uu5Elements.Box>
    );

    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Cover };
export default Cover;
//@@viewOff:exports
