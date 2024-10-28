//@@viewOn:imports
import { createVisualComponent, Lsi, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import Router from "./router";
import { SpaProvider, Spa as SpaView } from "../libs/oc_cli-app";
import Page from "../libs/oc_cli-app/page";
import logoUri from "../assets/AFK_erb_light_160x160.png";
import { AppProvider } from "./app/app-context";

const Home = Utils.Component.lazy(() => import("../routes/home.js"));
const Team = Utils.Component.lazy(() => import("../routes/team.js"));
const TeamMatches = Utils.Component.lazy(() => import("../routes/team-matches.js"));
const TeamTable = Utils.Component.lazy(() => import("../routes/team-table.js"));

const TeamsEdit = Utils.Component.lazy(() => import("../routes/profile/teams.js"));
const SeasonsEdit = Utils.Component.lazy(() => import("../routes/profile/seasons.js"));
const MatchesEdit = Utils.Component.lazy(() => import("../routes/profile/matches.js"));
const BinariesEdit = Utils.Component.lazy(() => import("../routes/profile/binaries.js"));
const AppEdit = Utils.Component.lazy(() => import("../routes/profile/app.js"));

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
  "$teams",
  { children: "Fotogalerie", href: "photogallery" },
  { children: "Diskuze", href: "discussion", itemList: [{ children: "Ke stažení", href: "download" }] },
  { children: "Kontakt", href: "contact", itemList: [{ children: "Výbor", href: "board" }] },
  {
    key: "identity",
    itemList: [
      { children: "Týmy", href: "profile/teams", profile: "operatives" },
      { children: "Sezóny", href: "profile/seasons", profile: "operatives" },
      { children: "Zápasy", href: "profile/matches", profile: "operatives" },
      { children: "Soubory", href: "profile/binaries", profile: "operatives" },
      { children: "App", href: "profile/app", profile: "authorities" },
    ],
  },
];

const ROUTE_MAP = {
  "": { redirect: "home" },
  home: (props) => <Home {...props} />,

  "profile/teams": (props) => <TeamsEdit {...props} />,
  "profile/seasons": (props) => <SeasonsEdit {...props} />,
  "profile/matches": (props) => <MatchesEdit {...props} />,
  "profile/binaries": (props) => <BinariesEdit {...props} />,
  "profile/app": (props) => <AppEdit {...props} />,

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
function getMenuList(appData) {
  let menuList = MENU;

  const index = MENU.indexOf("$teams");
  if (index > -1) {
    menuList = [...MENU];
    menuList.splice(index, 1);

    Object.keys(appData.teams).forEach((age, i) => {
      menuList.splice(index + i, 0, {
        children: Config.AGE_MAP[age].name,
        href: "team",
        itemList: [
          { children: <Lsi lsi={{ cs: "Zápasy" }} />, href: "team/matches" },
          age === "old" ? null : { children: <Lsi lsi={{ cs: "Tabulka" }} />, href: "team/table" },
        ].filter(Boolean),
      });
    });
  }
  return menuList;
}

function getRouteMap(appData) {
  const routeMap = { ...ROUTE_MAP };

  for (let age in appData.teams) {
    const team = appData.teams[age];
    const params = { id: team.teamId };
    routeMap.team = (props) => <Team {...props} params={{ ...props.params, ...params }} />;
    routeMap["team/matches"] = (props) => <TeamMatches {...props} params={{ ...props.params, ...params }} />;
    if (age !== "old") {
      routeMap["team/table"] = (props) => <TeamTable {...props} params={{ ...props.params, ...params }} />;
    }
  }

  return routeMap;
}
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
        <AppProvider>
          {({ data }) =>
            data ? (
              <Uu5Elements.SpacingProvider type="loose">
                <SpaView>
                  <Page logoUri={logoUri} logoHref="home" logoTooltip="AFK BRATČICE" menuList={getMenuList(data)}>
                    <Router routeMap={getRouteMap(data)} />
                  </Page>
                </SpaView>
              </Uu5Elements.SpacingProvider>
            ) : (
              <Uu5Elements.Pending size="max" />
            )
          }
        </AppProvider>
      </SpaProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spa };
export default Spa;
//@@viewOff:exports
