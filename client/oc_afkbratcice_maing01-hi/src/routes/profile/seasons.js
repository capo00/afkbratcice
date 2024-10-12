//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import * as OcApp from "../../libs/oc_cli-app";
import SeasonCrud from "../../core/season/season-crud";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Seasons = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Seasons",
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
      return <SeasonCrud />;
      //@@viewOff:render
    },
  }),
  { profileList: ["operatives"] },
);

//@@viewOn:exports
export { Seasons };
export default Seasons;
//@@viewOff:exports
