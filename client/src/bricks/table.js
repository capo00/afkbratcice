import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";
import Calls from '../calls.js';

import "./table.less";

const Table = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.LoadMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("Table"),
    classNames: {
      main: Cfg.css("table")
    },
    calls: {
      onLoad: 'getTable'
    }
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    season: PropTypes.number,
    team: PropTypes.string,
    size: PropTypes.oneOf(["s", "l"])
  },
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  getDefaultProps() {
    return {
      season: null,
      team: "M",
      size: "l"
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
      season: props.season,
      team: props.team
    };
  },
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _getHeader() {
    let header = null;

    if (this.props.size === "l") {
      header = [
        "",
        "Tým",
        <UU5.Bricks.Span tooltip="Odehrané zápasy">Z</UU5.Bricks.Span>,
        <UU5.Bricks.Span tooltip="Výhry">V</UU5.Bricks.Span>,
        <UU5.Bricks.Span tooltip="Vyharné penalty">VP</UU5.Bricks.Span>,
        <UU5.Bricks.Span tooltip="Prohrané penalty">PP</UU5.Bricks.Span>,
        <UU5.Bricks.Span tooltip="Prohry">P</UU5.Bricks.Span>,
        "Skóre",
        <UU5.Bricks.Span tooltip="Body">B</UU5.Bricks.Span>
      ];
    }

    return header;
  },

  _getRows(data) {
    return data.map((team, i) => {
      let row;
      if (this.props.size === "l") {
        row = [
          i + 1,
          team.name,
          team.played,
          team.wins,
          team.penaltyWins,
          team.penaltyLosses,
          team.losses,
          `${team.goalsFor}:${team.goalsAgainst}`,
          team.points
        ];
      } else {
        row = [i + 1, team.name, team.points];
      }
      return row;
    });
  },

  _renderTable(dtoOut) {
    console.log("table", dtoOut);
    return (
      <UU5.Bricks.DataTable condensed hover rows={this._getRows(dtoOut.data)} headerRow={this._getHeader()} />
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Section {...this.getMainPropsToPass()}>
        {this.getLoadFeedbackChildren(this._renderTable)}
      </UU5.Bricks.Section>
    );
  }
  //@@viewOff:render
});

export default Table;
