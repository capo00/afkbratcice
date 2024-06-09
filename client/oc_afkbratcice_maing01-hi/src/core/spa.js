//@@viewOn:imports
import { createVisualComponent, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import Router from "./router";
import Home from "../routes/home.js";
import Test from "../routes/test.js";
import TheChase from "../routes/the-chase";
import { SpaProvider, Spa as SpaView } from "../libs/capo-app/index";
import Page from "../libs/capo-app/page";
import logoUri from "../assets/AFK_erb_light_160x160.png";
//@@viewOff:imports

//@@viewOn:constants
// const About = Utils.Component.lazy(() => import("../routes/about.js"));
// const InitAppWorkspace = Utils.Component.lazy(() => import("../routes/init-app-workspace.js"));
// const ControlPanel = Utils.Component.lazy(() => import("../routes/control-panel.js"));

const MENU = [
  {
    children: "Historie",
    href: "history",
    itemList: [
      { children: "Týmové fotky", href: "teamPhotos" },
      { children: "Hymna", href: "hymn" },
    ],
  },
  {
    children: "Muži",
    href: "men",
    itemList: [
      { children: "Zápasy", href: "men/matches" },
      { children: "Tabulka", href: "men/table" },
    ],
  },
  { children: "Stará garda", href: "oldMen", itemList: [{ children: "Zápasy", href: "oldMen/matches" }] },
  { children: "Fotogalerie", href: "photogallery" },
  { children: "Diskuze", href: "discussion", itemList: [{ children: "Ke stažení", href: "download" }] },
  { children: "Kontakt", href: "contact", itemList: [{ children: "Výbor", href: "board" }] },
];

const ROUTE_MAP = {
  "": { redirect: "home" },
  home: (props) => <Home {...props} />,
  test: (props) => <Test {...props} />,
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

    //@@viewOn:render
    return (
      <SpaProvider>
        <SpaView>
          <Uu5Elements.SpacingProvider type="loose">
            <Page logoUri={logoUri} logoHref="home" logoTooltip="AFK BRATČICE" menuList={MENU}>
              <Router routeMap={ROUTE_MAP} />
            </Page>
          </Uu5Elements.SpacingProvider>
        </SpaView>
      </SpaProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spa };
export default Spa;
//@@viewOff:exports
