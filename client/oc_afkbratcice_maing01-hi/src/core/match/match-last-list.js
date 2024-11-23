//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import MatchCrud from "./match-crud";
import { useSession } from "../../libs/oc_cli-auth";
//@@viewOff:imports

const MatchLastList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchLastList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { teamId, seasonId } = props;
    const { identity } = useSession();

    //@@viewOn:render
    return (
      <MatchCrud
        teamId={teamId}
        seasonId={seasonId}
        readOnly={!identity?.profileList?.includes?.("operatives")}
        hideColumns={["seasonId"]}
      />
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchLastList };
export default MatchLastList;
//@@viewOff:exports
