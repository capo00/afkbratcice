//@@viewOn:imports
import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import OcAuth from "../libs/oc_cli-auth/index.js";
import Config from "./config/config.js";
import { Call } from "../libs/oc_cli-elements/index.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const MatchList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchList",
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

    const session = OcAuth.useSession();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <div>
        MatchList
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchList };
export default MatchList;
//@@viewOff:exports
