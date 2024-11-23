//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import MatchLastList from "../core/match/match-last-list";
import { useApp } from "../core/app/app-context";
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
    const { data } = useApp();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Grid templateColumns="1fr" rowGap={spacing.c}>
        <MatchLastList teamId={id} seasonId={data.teams.men.seasonId ?? "671d72cdf07fb9d019412ecf"} />
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamMatches };
export default TeamMatches;
//@@viewOff:exports
