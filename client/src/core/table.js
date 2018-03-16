import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";

import "./table.less";

const NAME = "Table";
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
      <UU5.Bricks.Section {...this.getMainPropsToPass()} header="">

      </UU5.Bricks.Section>
    );
  }
  //@@viewOff:render
});
