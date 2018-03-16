import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./_config.js";
import Top from "../bricks/top.js";
import Home from "./home.js";

import "./app.less";

const App = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.APP + ".App",
    classNames: {
      main: Cfg.CSS + "-app"
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
              "/historie": { component: <Home /> },
              "/tymove-fotky": { component: <Home /> },
              "/hymna": { component: <Home /> },
              "/vybor-afk": { component: <Home /> },
              "/ke-stazeni": { component: <Home /> },
              "/soupiska": { component: <Home /> },
              "/zapasy": { component: <Home /> },
              "/tabulka": { component: <Home /> },
              "/soupiska-stara-garda": { component: <Home /> },
              "/fotogalerie": { component: <Home /> },
              "/diskuze": { component: <Home /> },
              "/kontakt": { component: <Home /> }
            }}
          />
        </UU5.Bricks.Container>
      </UU5.Bricks.Page>
    );
  }
  //@@viewOff:render
});

export default App;
