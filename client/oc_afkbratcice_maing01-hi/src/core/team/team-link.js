//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { useTeam } from "./team-context";
import OcElements from "../../libs/oc_cli-elements";
//@@viewOff:imports

const TeamLink = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamLink",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { id } = props;

    const { data: teamList } = useTeam();
    const data = teamList.find(({ data }) => data.id === id)?.data ?? {};

    //@@viewOn:render
    return (
      <span className={Config.Css.css({ display: "inline-flex", alignItems: "center" })}>
        <OcElements.Image
          src={data.logoUri}
          alt=" "
          className={Config.Css.css({
            height: "1.3em",
            marginInlineEnd: "0.7em",
          })}
        />
        {data.name}
      </span>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamLink };
export default TeamLink;
//@@viewOff:exports
