import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./_config.js";
import Articles from '../bricks/articles.js';

import "./home.less";

const Home = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.CcrReaderMixin,
    UU5.Common.RouteMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.APP + ".Home",
    classNames: {
      main: Cfg.CSS + "-home"
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
  onRouteChanged_(prevProps, prevState) {
    this.getCcrComponentByKey("Menu").setActive("home");
  },
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Div {...this.getMainPropsToPass()}>
        <Articles />
      </UU5.Bricks.Div>
    );
  }
  //@@viewOff:render
});

export default Home;
