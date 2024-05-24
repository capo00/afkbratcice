//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
import Cover from "../cover";
import Amount from "../amount";
import QuitButton from "./quit-button";
//@@viewOff:imports

const Final = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Final",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { winner, sum } = props;

    //@@viewOn:render
    return (
      <Cover colorScheme={winner === "hunter" ? "red" : undefined}>
        <Uu5Elements.Text category="interface" segment="title" type="main">
          Konec
        </Uu5Elements.Text>
        <Uu5Elements.Text category="interface" segment="title" type="major">
          Vítězem {winner === "hunter" ? "je lovec" : "jsou hráči"}
        </Uu5Elements.Text>
        {winner !== "hunter" && (
          <Uu5Elements.Text category="interface" segment="title" type="common">
            Výhra: <Amount value={sum} />
          </Uu5Elements.Text>
        )}
        <QuitButton size="xl" significance="highlighted">
          Ukončit hru
        </QuitButton>
      </Cover>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Final };
export default Final;
//@@viewOff:exports
