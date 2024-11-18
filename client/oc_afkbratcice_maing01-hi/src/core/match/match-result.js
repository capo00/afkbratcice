//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

const MatchResult = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchResult",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { data, name, animation, ...restProps } = props;

    const animationCss = animation
      ? {
          background: "linear-gradient(to bottom right, white 30%, #8b0000 50%, white 80%)",
          backgroundClip: "text",
          textFillColor: "transparent",
          backgroundSize: "200% 200%",
          animation: `${Config.Css.keyframes({
            from: {
              backgroundPosition: "100% 100%",
            },

            to: {
              backgroundPosition: "0 0",
            },
          })} 1s linear infinite`,
        }
      : null;

    //@@viewOn:render
    return (
      <Uu5Elements.Grid {...restProps} templateColumns="1fr auto 1fr" columnGap={2} rowGap={2}>
        {({ style }) => (
          <Uu5Elements.Grid.Item
            alignSelf={data ? "center" : undefined}
            gridArea={name}
            className={data ? Config.Css.css({ ...style, ...animationCss }) : undefined}
          >
            {data ? (
              <>
                <Uu5Elements.Text category="interface" segment="title" type="main">
                  {({ style }) => (
                    <>
                      <b className={Config.Css.css({ ...style, justifySelf: "end", marginInlineEnd: 2 })}>
                        {data.homeGoals == null ? "?" : data.homeGoals}
                      </b>
                      <b className={Config.Css.css(style)}>:</b>
                      <b className={Config.Css.css({ ...style, marginInlineStart: 2 })}>
                        {data.guestGoals == null ? "?" : data.guestGoals}
                      </b>
                    </>
                  )}
                </Uu5Elements.Text>
                {data.homeGoalsHalf == null ? null : (
                  <>
                    <span className={Config.Css.css({ justifySelf: "end" })}>({data.homeGoalsHalf}</span>
                    <span className={Config.Css.css({ justifySelf: "center" })}>:</span>
                    <span>{data.guestGoalsHalf})</span>
                  </>
                )}
              </>
            ) : (
              <Uu5Elements.Skeleton borderRadius="moderate" height="100%" width={54} />
            )}
          </Uu5Elements.Grid.Item>
        )}
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchResult };
export default MatchResult;
//@@viewOff:exports
