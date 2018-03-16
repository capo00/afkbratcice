import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Calls from '../calls.js';

import "./articles.less";

const ClosestMatches = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.LoadMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("ClosestMatches"),
    classNames: {
      main: Cfg.css("closestmatches")
    },
    defaults: {

    },
    calls: {
      onLoad: 'getClosestMatches'
    },
    lsi: {

    }
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  //@@viewOff:getDefaultProps

  //@@viewOn:standardComponentLifeCycle
  componentWillMount() {
    this.setCalls(Calls);
  },
  //@@viewOff:standardComponentLifeCycle

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:overridingMethods
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _renderClosestMatches(dtoOut) {
    console.log(dtoOut);

    return (
      <UU5.Bricks.Div>
        <UU5.Bricks.Todo props={dtoOut} />
      </UU5.Bricks.Div>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Section {...this.getMainPropsToPass()} header="Closes Matches">
        {this.getLoadFeedbackChildren(this._renderClosestMatches)}
      </UU5.Bricks.Section>
    );
  }
  //@@viewOff:render
});

export default ClosestMatches;
