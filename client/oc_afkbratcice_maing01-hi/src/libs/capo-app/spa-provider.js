//@@viewOn:imports
import {
  createVisualComponent,
  AppBackgroundProvider,
  RouteProvider,
  LanguageListProvider,
  LanguageProvider,
} from "uu5g05";
import { GoogleSessionProvider } from "../capo-google-auth";
import Config from "./config/config.js";
//@@viewOff:imports

//@@viewOn:constants
const CLIENT_ID = "320438662814-hgjqtc69jbs4d7ec9mgo9efnkp2oioj0.apps.googleusercontent.com"; // Replace with your actual Client ID
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const SpaProvider = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SpaProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render({ children }) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return (
      <AppBackgroundProvider>
        <LanguageListProvider languageList={["cs"]}>
          <LanguageProvider>
            <GoogleSessionProvider clientId={CLIENT_ID}>
              <RouteProvider>{children}</RouteProvider>
            </GoogleSessionProvider>
          </LanguageProvider>
        </LanguageListProvider>
      </AppBackgroundProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SpaProvider };
export default SpaProvider;
//@@viewOff:exports
