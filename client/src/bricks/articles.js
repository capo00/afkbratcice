import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Calls from '../calls.js';
import ArticleItem from './article-item.js';

import "./articles.less";

const Articles = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.LoadMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("Articles"),
    classNames: {
      main: Cfg.css("articles")
    },
    defaults: {
      pageSize: 5
    },
    calls: {
      onLoad: 'getArticles'
    },
    lsi: {
      allArticles: {
        cs: "Více"
      }
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
  getOnLoadData_(props) {
    return {
      pageSize: this.getDefault().pageSize
    };
  },
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _navigate() {
    Cfg.route("clanky");
  },

  _renderArticles(dtoOut) {
    let articles;

    if (dtoOut.data) {
      articles = dtoOut.data.map(article => {
        return (
          <UU5.Bricks.Carousel.Item key={article.id}>
            <ArticleItem {...article} />
          </UU5.Bricks.Carousel.Item>
        );
      })
    }

    return (
      <UU5.Bricks.Carousel type="circular" interval={10000} colorSchema="red-rich">
        {articles}
      </UU5.Bricks.Carousel>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Div {...this.getMainPropsToPass()}>
        {this.getLoadFeedbackChildren(this._renderArticles)}
        <UU5.Bricks.Button bgStyle="transparent" colorSchema="red-rich" content={this.getLsiComponent("allArticles")} onClick={this._navigate} />
      </UU5.Bricks.Div>
    );
  }
  //@@viewOff:render
});

export default Articles;
