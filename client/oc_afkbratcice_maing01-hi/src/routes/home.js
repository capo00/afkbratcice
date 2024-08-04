//@@viewOn:imports
import { Utils, createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import TeamManager from "../core/team-manager";
import Config from "./config/config.js";
import News from "../core/news";
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
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);
    return (
      <div {...attrs}>
        <News />
        {/*<TeamManager />*/}
        {Array(40)
          .fill(null)
          .map((_, i) => (
            <h1 key={i}>AAA</h1>
          ))}
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Home };
export default Home;
//@@viewOff:exports
