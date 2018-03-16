import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./_config.js";
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
    tagName: Cfg.APP + ".Table",
    classNames: {
      main: Cfg.CSS + "-table"
    },
    calls: {
      onLoad: 'getTable'
    }
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    season: PropTypes.number,
    size: PropTypes.oneOf(["s", "l"])
  },
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  getDefaultProps() {
    return {
      season: null,
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
      season: props.season || new Date().getFullYear()
    };
  },
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _renderTable(dtoOut) {
    console.log(dtoOut);
    // let teams;
    // if (dtoOut.data && dtoOut.data.teams) {
    //   teams = dtoOut.data.teams.map(team => {
    //     return <TableItem {...team} key={team.id} />;
    //   })
    // }

    return (
      <UU5.Bricks.Div>
        <UU5.Bricks.Todo props={dtoOut.data} />
      </UU5.Bricks.Div>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return (
      <UU5.Bricks.Section {...this.getMainPropsToPass()} header="Table">
        {this.getLoadFeedbackChildren(this._renderTable)}
      </UU5.Bricks.Section>
    );
  }
  //@@viewOff:render
});

export default Table;
