import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Tools from "../tools.js";
import Calls from '../calls.js';
import Timer from "./timer.js";

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
    defaults: {},
    calls: {
      onLoad: 'getClosestMatches'
    },
    lsi: {}
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    team: PropTypes.string
  },
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  getDefaultProps() {
    return {
      team: Cfg.MEN
    };
  },
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
      team: props.team
    };
  },
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _renderLastMatch(match) {
    let result;
    if (match) {
      let date = new Date(match.date);

      result = (
        <UU5.Bricks.Tabs.Item header="Poslední" name="last">
          {match.round ? `${match.round}. kolo` : "přátelský"} - {Cfg.TEAMS[this.props.team].name} <br />
          <b>
            <UU5.Bricks.Link>
              {match.home} - {match.guest}
            </UU5.Bricks.Link>
          </b><br />
          <b>
            {match.goalsFor}:{match.goalsAgainst}{match.penalty && "p"} ({match.goalsForHalf}:{match.goalsAgainstHalf})
          </b><br />
          ({Cfg.DAYS[Tools.getWeekDay(date) - 1]}) <UU5.Bricks.DateTime value={date} secondsDisabled />
        </UU5.Bricks.Tabs.Item>
      );
    }

    return result;
  },

  _renderNextMatch(match) {
    let result;
    if (match) {
      let date = new Date(match.date);

      result = (
        <UU5.Bricks.Tabs.Item header="Následující" name="next">
          {match.round ? `${match.round}. kolo` : "přátelský"} - {Cfg.TEAMS[this.props.team].name} <br />
          <b>
            {match.home} - {match.guest}
          </b><br />
          ({Cfg.DAYS[Tools.getWeekDay(date) - 1]}) <UU5.Bricks.DateTime value={date} secondsDisabled /> <br />
          <Timer time={date} />
        </UU5.Bricks.Tabs.Item>
      );
    }

    return result;
  },

  _renderClosestMatches(dtoOut) {
    console.log("closestMatches", dtoOut);

    return (
      <UU5.Bricks.Tabs colorSchema="red-rich" type="pills" justified fade>
        {this._renderLastMatch(dtoOut.data.last)}
        {this._renderNextMatch(dtoOut.data.next)}
      </UU5.Bricks.Tabs>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Section {...this.getMainPropsToPass()}>
        {this.getLoadFeedbackChildren(this._renderClosestMatches)}
      </UU5.Bricks.Section>
    );
  }
  //@@viewOff:render
});

export default ClosestMatches;
