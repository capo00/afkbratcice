//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "../config/config.js";
import { useSeason } from "./season-context";
//@@viewOff:imports

const SeasonText = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "SeasonText",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    displayAge: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    const { id, displayAge } = props;

    const { data: seasonList } = useSeason();
    const data = seasonList.find(({ data }) => data.id === id)?.data;

    //@@viewOn:render
    return data ? (
      <>
        {data.competition} {data.yearFrom}
        {displayAge ? ` - ${Config.AGE_MAP[data.age].name}` : ""}
      </>
    ) : null;
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { SeasonText };
export default SeasonText;
//@@viewOff:exports
