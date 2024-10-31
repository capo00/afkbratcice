//@@viewOn:imports
import { createVisualComponent, useContentSize, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import MatchInfo from "./match-info";
import MatchTeam from "./match-team";
//@@viewOff:imports

function Result({ data, name }) {
  return (
    <Uu5Elements.Grid templateColumns="1fr auto 1fr" columnGap={2} rowGap={2}>
      {({ style }) => (
        <Uu5Elements.Grid.Item
          alignSelf={data ? "center" : undefined}
          gridArea={name}
          className={data ? Config.Css.css(style) : undefined}
        >
          {data ? (
            <>
              <Uu5Elements.Text category="interface" segment="title" type="main">
                {({ style }) => (
                  <>
                    <b className={Config.Css.css({ ...style, justifySelf: "end", marginInlineEnd: 2 })}>
                      {data.homeGoals}
                    </b>
                    <b className={Config.Css.css(style)}>:</b>
                    <b className={Config.Css.css({ ...style, marginInlineStart: 2 })}>{data.guestGoals}</b>
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
}

const MatchLastList = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchLastList",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { teamId } = props;
    // TODO

    const { data } = useDataObject({
      handlerMap: {
        load: () => OcElements.Call.cmdGet("match/getLast", { teamId }),
      },
    });

    const contentSize = useContentSize();
    const isSmall = ["xs", "s"].includes(contentSize);

    const space = Uu5Elements.useSpacing();

    //@@viewOn:render
    return (
      <Uu5Elements.Grid templateAreas="homeTeam result guestTeam, info info info" templateColumns="1fr auto 1fr">
        {({ style }) => (
          <Uu5Elements.Box
            borderRadius="moderate"
            className={Config.Css.css({ ...style, paddingBlock: space.d, paddingInline: space.c })}
            // height={184}
            shape="background"
            significance="distinct"
          >
            <MatchTeam data={data} name="homeTeam" align="end" displayName={!isSmall} />
            <MatchTeam data={data} name="guestTeam" displayName={!isSmall} />
            <MatchInfo data={data} name="info" />
            <Result data={data} name="result" />
          </Uu5Elements.Box>
        )}
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchLastList };
export default MatchLastList;
//@@viewOff:exports
