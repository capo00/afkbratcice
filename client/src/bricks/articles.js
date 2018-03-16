import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./_config.js";
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
    tagName: Cfg.APP + ".Articles",
    classNames: {
      main: Cfg.CSS + "-articles"
    },
    defaults: {
      pageSize: 5
    },
    calls: {
      onLoad: 'getArticles'
    },
    lsi: {
      header: {
        cs: 'Novinky'
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
  _renderArticles(dtoOut) {
    let articles;

    if (dtoOut.data) {
      articles = dtoOut.data.map(article => {
        return (
          <UU5.Bricks.Carousel.Item key={article.id}>
            <ArticleItem data={article} />
          </UU5.Bricks.Carousel.Item>
        );
      })
    }

    return (
      <UU5.Bricks.Div>
        <UU5.Bricks.Carousel>
          {articles}
        </UU5.Bricks.Carousel>

        Všechny články
      </UU5.Bricks.Div>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Section {...this.getMainPropsToPass()} header={this.getLsiComponent('header')}>
        {this.getLoadFeedbackChildren(this._renderArticles)}
      </UU5.Bricks.Section>
    );
  }
  //@@viewOff:render
});

export default Articles;
