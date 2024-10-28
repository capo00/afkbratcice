//@@viewOn:imports
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import TeamItem from "../team/team-item";
//@@viewOff:imports

function MatchTeam({ data, name, align, displayName }) {
  const team = data?.[name];
  return (
    <Uu5Elements.Grid.Item gridArea={name} justifySelf={team ? align : undefined}>
      {({ style }) =>
        team ? (
          <TeamItem
            {...team}
            size="l"
            displayName={displayName}
            reverse={align === "end"}
            className={Config.Css.css(style)}
          />
        ) : (
          <Uu5Elements.Skeleton borderRadius="moderate" height={56} className={Config.Css.css(style)} />
        )
      }
    </Uu5Elements.Grid.Item>
  );
}

//@@viewOn:exports
export { MatchTeam };
export default MatchTeam;
//@@viewOff:exports
