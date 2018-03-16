import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Menu from "./menu.js";

import "./top.less";

const Top = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("Top"),
    classNames: {
      main: Cfg.css("top"),
      title: "title",
      menu: "menu"
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
    return (
      <UU5.Bricks.Div {...this.getMainPropsToPass()}>
        <UU5.Bricks.Div className={this.getClassName("title")}>
          <span>AFK BRATČICE</span>
          <UU5.Bricks.Image src="assets/afk_erb_light_150x150.png" responsive={false} />
          <span>OFICIÁLNÍ WEB</span>
        </UU5.Bricks.Div>

        <UU5.Bricks.Heading className={this.getClassName("menu")} fixedOnScroll>
          <UU5.Bricks.NavBar>
            <UU5.Bricks.NavBar.Header>
              <UU5.Bricks.Image src="assets/afk_erb_light_150x150.png" responsive={false} />
              <span>AFK BRATČICE</span>
            </UU5.Bricks.NavBar.Header>

            <UU5.Bricks.NavBar.Nav allowTags={["AFK.Bricks.Menu"]}>
              <Menu />
            </UU5.Bricks.NavBar.Nav>
          </UU5.Bricks.NavBar>
        </UU5.Bricks.Heading>
      </UU5.Bricks.Div>
    );
  }
  //@@viewOff:render
});

export default Top;
