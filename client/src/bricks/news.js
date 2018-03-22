import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Calls from "../calls.js";

import "./news.less";

const News = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.LoadMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("News"),
    classNames: {
      main: Cfg.css("news")
    },
    calls: {
      onLoad: 'getNews'
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
  _renderChildren(dtoOut) {
    console.log("news", dtoOut);

    return (
      <UU5.Bricks.Ul>
        {dtoOut.data.map((news, i) => {
          return (
            <UU5.Bricks.Li key={i} content={`<uu5string/>${news.content}`} />
          )
        })}
      </UU5.Bricks.Ul>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Div {...this.getMainPropsToPass()}>
        {this.getLoadFeedbackChildren(this._renderChildren)}
      </UU5.Bricks.Div>
    );
  }
  //@@viewOff:render
});

export default News;
