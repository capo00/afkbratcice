//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import Router from "./router";
import { SpaProvider, Spa as SpaView } from "../libs/oc_cli-app";
import Page from "../libs/oc_cli-app/page";
import logoUri from "../assets/AFK_erb_light_160x160.png";

const Home = Utils.Component.lazy(() => import("../routes/home.js"));
const Teams = Utils.Component.lazy(() => import("../routes/profile/teams.js"));
const Binaries = Utils.Component.lazy(() => import("../routes/profile/binaries.js"));
const Seasons = Utils.Component.lazy(() => import("../routes/profile/seasons.js"));
const Matches = Utils.Component.lazy(() => import("../routes/profile/matches.js"));
const TheChase = Utils.Component.lazy(() => import("../routes/the-chase.js"));
//@@viewOff:imports

// TODO change color to dark red (after release of UuGds)
Uu5Elements.UuGds.setMeaningColor("primary", "red");
Uu5Elements.UuGds.setMeaningColor("negative", "orange");
Uu5Elements.UuGds.setMeaningColor("warning", "yellow");

//@@viewOn:constants
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
  {
    key: "identity",
    itemList: [
      { children: "Týmy", href: "profile/teams", profile: "operatives" },
      { children: "Soubory", href: "profile/binaries", profile: "operatives" },
      { children: "Sezóny", href: "profile/seasons", profile: "operatives" },
      { children: "Zápasy", href: "profile/matches", profile: "operatives" },
    ],
  },
];

const ROUTE_MAP = {
  "": { redirect: "home" },
  home: (props) => <Home {...props} />,
  "profile/teams": (props) => <Teams {...props} />,
  "profile/binaries": (props) => <Binaries {...props} />,
  "profile/seasons": (props) => <Seasons {...props} />,
  "profile/matches": (props) => <Matches {...props} />,
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
