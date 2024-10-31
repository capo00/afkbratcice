//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import MatchLastList from "../core/match/match-last-list";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TeamMatches = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamMatches",
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
    const spacing = Uu5Elements.useSpacing();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Grid templateColumns="1fr" rowGap={spacing.c}>
        <MatchLastList teamId={id} />
        <div>TODO matches next</div>
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamMatches };
export default TeamMatches;
//@@viewOff:exports
