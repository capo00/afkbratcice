//@@viewOn:imports
import {
  createVisualComponent,
  AppBackgroundProvider,
  RouteProvider,
  LanguageListProvider,
  LanguageProvider,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";

import Config from "./config/config.js";
import Home from "../routes/home.js";
import Router from "./router";
import TheChase from "../routes/the-chase";
//@@viewOff:imports

//@@viewOn:constants
// const About = Utils.Component.lazy(() => import("../routes/about.js"));
// const InitAppWorkspace = Utils.Component.lazy(() => import("../routes/init-app-workspace.js"));
// const ControlPanel = Utils.Component.lazy(() => import("../routes/control-panel.js"));

const ROUTE_MAP = {
  "": { redirect: "home" },
  home: (props) => <Home {...props} />,
  theChase: (props) => <TheChase {...props} />,
  // controlPanel: (props) => <ControlPanel {...props} />,
  "*": () => (
    <Uu5Elements.Text category="story" segment="heading" type="h1">
      Not Found
    </Uu5Elements.Text>
  ),
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Spa = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Spa",
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
    return (
      <AppBackgroundProvider>
        <LanguageListProvider languageList={["cs"]}>
          <LanguageProvider>
            <RouteProvider>
              <Uu5Elements.ModalBus>
                <Router routeMap={ROUTE_MAP} />
              </Uu5Elements.ModalBus>
            </RouteProvider>
          </LanguageProvider>
        </LanguageListProvider>
      </AppBackgroundProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spa };
export default Spa;
//@@viewOff:exports
