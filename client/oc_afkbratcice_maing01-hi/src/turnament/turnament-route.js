//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import Config from "./config/config.js";
import TurnamentCrud from "./turnament-crud.js";
import TurnamentWelcome from "./turnament-welcome.js";
import OcAuth from "../libs/oc_cli-auth";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const TurnamentRoute = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TurnamentRoute",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const session = OcAuth.useSession();
    const isAuth = session.identity?.profileList?.includes?.("authorities");
    //@@viewOff:private

    //@@viewOn:render
    return session.state === "pending" ? null : isAuth ? <TurnamentCrud /> : <TurnamentWelcome />;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TurnamentRoute };
export default TurnamentRoute;
//@@viewOff:exports
