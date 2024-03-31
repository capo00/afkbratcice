//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
//@@viewOff:imports

const Welcome = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Welcome",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { onConfirm } = props;

    //@@viewOn:render
    const { elementProps } = Utils.VisualComponent.splitProps(
      props,
      Config.Css.css({ textAlign: "center", height: "100%", display: "flex", flexDirection: "column", gap: 40 }),
    );

    return (
      <Uu5Elements.Box
        shape="background"
        significance="highlighted"
        colorScheme="dark-blue"
        {...elementProps}
      >
        <Uu5Elements.Text category="story" segment="heading" type="h1">
          Vítejte ve hře Na lovu!
        </Uu5Elements.Text>

        <div>
          <Uu5Elements.Button size="xl" colorScheme="dark-blue" significance="highlighted" onClick={onConfirm}>
            Pozvat hráče
          </Uu5Elements.Button>
        </div>
      </Uu5Elements.Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Welcome };
export default Welcome;
//@@viewOff:exports
