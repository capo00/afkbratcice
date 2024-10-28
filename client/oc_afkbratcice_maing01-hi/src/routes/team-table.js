//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import SeasonTable from "../core/season/season-table";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TeamTable = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamTable",
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
        <SeasonTable teamId={id} />
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamTable };
export default TeamTable;
//@@viewOff:exports
