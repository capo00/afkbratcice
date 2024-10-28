//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import TeamDetail from "../core/team/team-detail";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let Team = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Team",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    params: {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { id } = props.params;
    //@@viewOff:private

    //@@viewOn:render
    return <TeamDetail id={id} />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Team };
export default Team;
//@@viewOff:exports
