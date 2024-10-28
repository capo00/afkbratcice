//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import News from "../core/news";
import SeasonTable from "../core/season/season-table";
import MatchLast from "../core/match/match-last";
import MatchNext from "../core/match/match-next";
import { useApp } from "../core/app/app-context";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let Home = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Home",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { data } = useApp();
    const spacing = Uu5Elements.useSpacing();
    //@@viewOff:private

    //@@viewOn:render
    return (
      <Uu5Elements.Grid
        templateAreas={{ xs: "matchLast, matchNext, table", l: "matchLast table, matchNext table" }}
        templateColumns={{ xs: "1fr", l: "2fr 1fr" }}
        rowGap={spacing.c}
      >
        {/*<News />*/}
        <MatchLast teamId={data.teams.men.teamId} className={Config.Css.css({ gridArea: "matchLast" })} />
        <MatchNext teamId={data.teams.men.teamId} className={Config.Css.css({ gridArea: "matchNext" })} />
        <SeasonTable teamId={data.teams.men.teamId} compact className={Config.Css.css({ gridArea: "table" })} />
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Home };
export default Home;
//@@viewOff:exports
