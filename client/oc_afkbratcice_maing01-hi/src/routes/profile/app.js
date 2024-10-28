//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import * as OcApp from "../../libs/oc_cli-app";
import AppConfig from "../../core/app/app-config";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const App = OcApp.withRoute(
  createVisualComponent({
    //@@viewOn:statics
    uu5Tag: Config.TAG + "App",
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
      return <AppConfig />;
      //@@viewOff:render
    },
  }),
  { profileList: ["authorities"] },
);

//@@viewOn:exports
export { App };
export default App;
//@@viewOff:exports
