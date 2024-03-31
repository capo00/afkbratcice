//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../../config/config";
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
    const attrs = Utils.VisualComponent.getAttrs(props);

    return (
      <div {...attrs}>
        <h1>Final</h1>
        <h2>Vítězem {winner === "hunter" ? "je lovec" : "jsou hráči"}</h2>
        {winner === "player" && (
          <h3>
            Výhra: <Uu5Elements.Number value={sum} currency="CZK" />
          </h3>
        )}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Final };
export default Final;
//@@viewOff:exports
