import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";

import "./timer.less";

const Timer = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("Timer"),
    classNames: {
      main: Cfg.css("timer")
    },
    defaults: {
      matchDuration: 120 * 60, // in seconds
      waitingDuration: 1, // in seconds
      nowDuration: 60 // in seconds
    }
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    time: PropTypes.instanceOf(Date).isRequired
  },
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  getDefaultProps() {
    return {
      time: null
    };
  },
  //@@viewOff:getDefaultProps

  //@@viewOn:standardComponentLifeCycle
  componentDidMount() {
    this._timerSecondsInterval = setInterval(this._update, this.getDefault("waitingDuration") * 1000);
  },

  componentWillUnmount() {
    this._timerSecondsInterval && clearInterval(this._timerSecondsInterval);
    this._timerMinutesInterval && clearInterval(this._timerMinutesInterval);
  },
  //@@viewOff:standardComponentLifeCycle

  //@@viewOn:interface
  //@@viewOff:interface

  //@@viewOn:overridingMethods
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _update() {
    let diff = this._getDiff();

    if (diff < this.getDefault("matchDuration")) {
      this._timerSecondsInterval && clearInterval(this._timerSecondsInterval);
      this._timerMinutesInterval && clearInterval(this._timerMinutesInterval);
    } else if (diff < 0) {
      this._timerSecondsInterval && clearInterval(this._timerSecondsInterval);
      // per minute
      this._timerMinutesInterval = setInterval(this._update, this.getDefault("nowDuration") * 1000);
    } else {
      this.forceUpdate();
    }
  },

  _getDiff() {
    let now = new Date();
    return Math.floor((this.props.time - now) / 1000);
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    let diff = this._getDiff();
    let result;

    if (diff < -this.getDefault("matchDuration")) {
      result = "DOHRÁNO";
    } else if (diff < 0) {
      result = "PRÁVĚ TEĎ";
    } else {
      let s = diff % 60;
      diff = Math.floor(diff / 60);
      let m = diff % 60;
      diff = Math.floor(diff / 60);
      let h = diff % 24;
      let d = Math.floor(diff / 24);

      let postfix;
      if (d === 1) {
        postfix = 'den';
      } else if (d === 2 || d === 3 || d === 4) {
        postfix = 'dny';
      } else {
        postfix = 'dnů';
      }

      result = `za ${d} ${postfix} ${h}:${UU5.Common.Tools.rjust(m, 2, '0')}:${UU5.Common.Tools.rjust(s, 2, '0')}`;
    }

    return (
      <UU5.Bricks.Span {...this.getMainPropsToPass()}>
        {result}
      </UU5.Bricks.Span>
    );
  }
  //@@viewOff:render
});

export default Timer;
