//@@viewOn:imports
import { createVisualComponent, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { useTeam } from "./team-context";
import OcElements from "../../libs/oc_cli-elements";
//@@viewOff:imports

const TeamItem = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamItem",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    displayName: true,
  },
  //@@viewOff:defaultProps

  render(props) {
    const { id, logoUri, name, size, displayName, reverse, ...restProps } = props;

    const { data: teamList } = useTeam() || {};
    const data = teamList?.find(({ data }) => data.id === id)?.data ?? {};

    //@@viewOn:render
    let height, gap, text;
    if (size === "l") {
      height = 56;
      gap = 16;
      text = (
        <Uu5Elements.Text category="interface" segment="title" type="major">
          {name || data.name}
        </Uu5Elements.Text>
      );
    } else {
      height = "1.3em";
      gap = "0.7em";
      text = <span>{name || data.name}</span>;
    }

    const attrs = Utils.VisualComponent.getAttrs(
      restProps,
      Config.Css.css({
        display: "inline-flex",
        alignItems: "center",
        gap,
        flexFlow: reverse ? "row-reverse" : undefined,
      }),
    );

    return (
      <span {...attrs}>
        <OcElements.Image
          src={logoUri || data.logoUri}
          alt=" "
          className={Config.Css.css({
            height,
            aspectRatio: "1/1",
          })}
        />
        {displayName && text}
      </span>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamItem };
export default TeamItem;
//@@viewOff:exports
