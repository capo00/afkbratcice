//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import * as OcApp from "../../libs/oc_cli-app";
import MatchCrud from "../../core/match/match-crud";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Matches = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Matches",
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
      return <MatchCrud />;
      //@@viewOff:render
    },
  }),
  { profileList: ["operatives"] },
);

//@@viewOn:exports
export { Matches };
export default Matches;
//@@viewOff:exports
