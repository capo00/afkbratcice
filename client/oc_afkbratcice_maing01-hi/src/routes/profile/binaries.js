//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import * as OcApp from "../../libs/oc_cli-app";
import BinaryCrud from "../../core/binary/binary-crud";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Binaries = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Binaries",
    //@@viewOff:statics

    //@@viewOn:propTypes
    propTypes: {},
    //@@viewOff:propTypes

    //@@viewOn:defaultProps
    defaultProps: {},
    //@@viewOff:defaultProps

    render(props) {
      //@@viewOn:private
      //@@viewOff:private

      //@@viewOn:interface
      //@@viewOff:interface

      //@@viewOn:render
      return <BinaryCrud />;
      //@@viewOff:render
    },
  }),
  { profileList: ["operatives"] },
);

//@@viewOn:exports
export { Binaries };
export default Binaries;
//@@viewOff:exports
