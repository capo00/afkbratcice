//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import * as OcApp from "../../libs/oc_cli-app";
import TeamCrud from "../../core/team/team-crud";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Teams = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "Teams",
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
      return <TeamCrud />;
      //@@viewOff:render
    },
  }),
  { profileList: ["operatives"] },
);

//@@viewOn:exports
export { Teams };
export default Teams;
//@@viewOff:exports
