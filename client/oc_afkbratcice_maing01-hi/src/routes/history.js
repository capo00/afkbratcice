//@@viewOn:imports
import { Lsi, createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useApp } from "../core/app/app-context";
import OcEcc from "../libs/oc_ecc";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let History = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "History",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data, handlerMap } = useApp();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <OcEcc.Page
        id={data.history?.id}
        name={{ cs: "Historie" }}
        onCreate={(e) => {
          handlerMap.update({ history: { id: e.data.id } });
        }}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { History };
export default History;
//@@viewOff:exports
