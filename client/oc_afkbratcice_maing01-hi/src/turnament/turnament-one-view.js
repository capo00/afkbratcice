//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import OcAuth from "../libs/oc_cli-auth";
import TeamList from "./team-list.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TurnamentOneView = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TurnamentOneView",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { dto } = props;

    const { data, handlerMap, state } = dto;
    
    const session = OcAuth.useSession();
    const editable = !!session.identity?.identity && data?.identityList?.find?.((identity) => identity === session.identity?.identity);
    
    console.log("data", state, data);
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Grid>
        <TeamList itemList={data.teamList} onUpdate={(teamList) => handlerMap.update({ ...data, teamList })} editable={editable} />
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TurnamentOneView };
export default TurnamentOneView;
//@@viewOff:exports
