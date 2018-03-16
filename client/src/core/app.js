import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Top from "../bricks/top.js";
import Home from "./home.js";
import History from "./history.js";
import TeamPhotos from "./team-photos.js";
import Hymn from "./hymn.js";
import BoardAfk from "./board-afk.js";
import Download from "./download.js";
import PlayerList from "./player-list.js";
import Matches from "./matches.js";
import Table from "./table.js";
import Photogallery from "./photogallery.js";
import Discussion from "./discussion.js";
import Contact from "./contact.js";

import "./app.less";

const App = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("App"),
    classNames: {
      main: Cfg.css("app")
    }
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  //@@viewOff:getDefaultProps

  //@@viewOn:standardComponentLifeCycle
  //@@viewOff:standardComponentLifeCycle

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:overridingMethods
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    let date = new Date();
    let year = date.getFullYear();

    return (
      <UU5.Bricks.Page
        {...this.getMainPropsToPass()}
        bottom={"© " + year + " AFK BRATČICE"}
        top={<Top />}
      >
        <UU5.Bricks.Container>
          <UU5.Common.Router
            basePath=""
            route="/"
            routes={{
              "/": { component: <Home /> },
              "/home": { component: <Home /> },
              "/historie": { component: <History /> },
              "/tymove-fotky": { component: <TeamPhotos /> },
              "/hymna": { component: <Hymn /> },
              "/vybor-afk": { component: <BoardAfk /> },
              "/ke-stazeni": { component: <Download /> },
              "/soupiska": { component: <PlayerList /> },
              "/zapasy": { component: <Matches /> },
              "/tabulka": { component: <Table /> },
              "/soupiska-stara-garda": { component: <PlayerList id="25" /> },
              "/fotogalerie": { component: <Photogallery /> },
              "/diskuze": { component: <Discussion /> },
              "/kontakt": { component: <Contact /> }
            }}
          />
        </UU5.Bricks.Container>
      </UU5.Bricks.Page>
    );
  }
  //@@viewOff:render
});

export default App;
