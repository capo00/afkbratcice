//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
import Cover from "../cover";
import Button from "../button";
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
    const { elementProps } = Utils.VisualComponent.splitProps(props, Config.Css.css({ justifyContent: "center" }));

    return (
      <Cover {...elementProps}>
        <Uu5Elements.Text category="story" segment="heading" type="h1">
          Vítejte ve hře
        </Uu5Elements.Text>
        <Uu5Elements.Text category="expose" segment="default" type="hero">
          Na lovu!
        </Uu5Elements.Text>
        <div className={Config.Css.css({ paddingBottom: 80 })}>
          <Button onClick={onConfirm}>Pozvat hráče</Button>
        </div>
      </Cover>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Welcome };
export default Welcome;
//@@viewOff:exports
