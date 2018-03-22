import React from "react";
import createReactClass from "create-react-class";
import * as UU5 from "uu5g04";
import "uu5g04-bricks";
import Cfg from "./config.js";

import "./top.less";

const menu = [
  { code: "home", route: "", label: <UU5.Bricks.Icon icon="mdi-home" /> },
  {
    code: "club", label: "Klub", items: [
      { route: "historie", label: "Historie" },
      { route: "tymove-fotky", label: "Týmové fotky" },
      { route: "hymna", label: "Hymna" },
      { route: "vybor-afk", label: "Výbor AFK" },
      { route: "ke-stazeni", label: "Ke stažení" }
    ]
  },
  {
    code: "men", route: "muzi", label: "Muži", items: [
      { route: "soupiska", label: "Soupiska" },
      { route: "zapasy", label: "Zápasy" },
      { route: "tabulka", label: "Tabulka" }
    ]
  },
  {
    code: "oldMen", route: "stara-garda", label: "Stará garda", items: [
      { route: "soupiska-stara-garda", label: "Soupiska" },
      { route: "zapasy-stara-garda", label: "Zápasy" },
    ]
  },
  { code: "photogallery", route: "fotogalerie", label: "Fotogalerie" },
  { code: "discussion", route: "diskuze", label: "Diskuze" },
  { code: "contact", route: "kontakt", label: "Kontakt" },
  { code: "login", route: "login", label: "Přihlásit" }
];

const Menu = createReactClass({

  //@@viewOn:mixins
  mixins: [
    UU5.Common.BaseMixin,
    UU5.Common.CcrWriterMixin
  ],
  //@@viewOff:mixins

  //@@viewOn:statics
  statics: {
    tagName: Cfg.app("Menu"),
    classNames: {
      main: Cfg.css("menu"),
      active: "active"
    },
    opt: {
      ccrKey: Cfg.CCR_MENU
    }
  },
  //@@viewOff:statics

  //@@viewOn:propTypes
  //@@viewOff:propTypes

  //@@viewOn:getDefaultProps
  //@@viewOff:getDefaultProps

  //@@viewOn:standardComponentLifeCycle
  getInitialState() {
    return {
      active: "home"
    };
  },

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.active !== nextState.active;
  },
  //@@viewOff:standardComponentLifeCycle

  //@@viewOn:interface
  setActive(code, setStateCallback) {
    this.setState({ active: code }, setStateCallback);
    return this;
  },
  //@@viewOff:interface

  //@@viewOn:overridingMethods
  //@@viewOff:overridingMethods

  //@@viewOn:componentSpecificHelpers
  _onClick(item, code = item.code) {
    if (code === "login") {

    } else {
      Cfg.route("/" + item.route);
    }
  },

  _getItem(item) {
    let content;
    let onClick;

    if (item.items) {
      content = (
        <UU5.Bricks.Dropdown label={item.label} closedOnLeave>
          {item.items.map(subItem => {
            return (
              <UU5.Bricks.Dropdown.Item
                key={subItem.route}
                label={subItem.label}
                onClick={() => this._onClick(subItem, item.code)}
              />
            )
          })}
        </UU5.Bricks.Dropdown>
      );
    } else {
      content = item.label;
      onClick = () => this._onClick(item);
    }

    return (
      <UU5.Bricks.NavBar.Nav.Item
        parent={this.getParent()}
        key={item.code}
        className={this.state.active === item.code ? this.getClassName("active") : null}
        onClick={onClick}
      >
        {content}
      </UU5.Bricks.NavBar.Nav.Item>
    );
  },
  //@@viewOff:componentSpecificHelpers

  //@@viewOn:render
  render() {
    return menu.map(this._getItem);
  }
  //@@viewOff:render
});

export default Menu;
