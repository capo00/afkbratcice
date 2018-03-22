import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Articles from "../bricks/articles.js";
import Table from "../bricks/table.js";
import ClosestMatches from "../bricks/closest-matches.js";

import "./home.less";

const NAME = "Home";
const CSS_NAME = NAME.toLowerCase();
const CODE = NAME.replace(/^([A-Z])/, (firstChar) => (firstChar.toLowerCase()));

export default createReactClass({

  displayName: NAME,

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.CcrReaderMixin,
    UU5.Common.RouteMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app(NAME),
    classNames: {
      main: Cfg.css(CSS_NAME)
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
    this.getCcrComponentByKey(Cfg.CCR_MENU).setActive(CODE);
  },
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Div {...this.getMainPropsToPass()}>
        <Articles />

        <UU5.Bricks.Row>
          <UU5.Bricks.Column colWidth="xs-12 s-6 m-4">
            <Table team="M" size="s" />
          </UU5.Bricks.Column>
          <UU5.Bricks.Column colWidth="xs-12 s-6 m-4">
            <ClosestMatches teamId={1} />
          </UU5.Bricks.Column>
          <UU5.Bricks.Column colWidth="xs-12 s-6 m-4">

          </UU5.Bricks.Column>
        </UU5.Bricks.Row>
      </UU5.Bricks.Div>
    );
  }
  //@@viewOff:render
});
