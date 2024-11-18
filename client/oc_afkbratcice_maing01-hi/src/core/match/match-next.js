//@@viewOn:imports
import { createVisualComponent, useContentSize, useDataObject, useEffect, useState, Fragment, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { Call } from "../../libs/oc_cli-elements";
import MatchTeam from "./match-team";
import MatchInfo from "./match-info";
import MatchResult from "./match-result";
//@@viewOff:imports

function getCountdown(dateTo) {
  const now = new Date();

  const diffMs = dateTo.getTime() - now.getTime();
  const diffS = Math.round(diffMs / 1000);

  const sec = diffS % 60;
  const diffMin = Math.floor(diffS / 60);
  const min = diffMin % 60;
  const diffHour = Math.floor(diffMin / 60);
  const hour = diffHour % 24;
  const day = Math.floor(diffHour / 24);

  return {
    sec,
    min,
    hour,
    day,
  };
}

function useCountdown(dateTo) {
  const [data, setData] = useState(() => getCountdown(dateTo));

  useEffect(() => {
    const interval = setInterval(() => setData(getCountdown(dateTo)), 1000);
    return () => clearInterval(interval);
  }, [dateTo]);

  return data;
}

function Countdown({ dateTo, ...restProps }) {
  const data = useCountdown(dateTo);

  return (
    <Uu5Elements.Grid
      {...restProps}
      display="inline"
      flow="column"
      templateRows="1fr auto"
      justifyItems="center"
      rowGap={4}
    >
      {["day", "hour", "min", "sec"].map((k) => (
        <Fragment key={k}>
          <span>{(data[k] + "").padStart(2, "0")}</span>
          <Uu5Elements.Text
            colorScheme="building"
            significance="subdued"
            className={Config.Css.css({ fontSize: "0.5em", lineHeight: 1 })}
          >
            {k[0].toUpperCase()}
          </Uu5Elements.Text>
        </Fragment>
      ))}
    </Uu5Elements.Grid>
  );
}

const MATCH_DURATION_MS = 1.75 * 60 * 60 * 1000;

function getMatchTimeState(time) {
  const timeDate = new Date(time);
  const timeMs = timeDate.getTime();
  const timeNowMs = new Date().getTime();

  // future
  let state = 0;
  if (timeNowMs < timeMs) {
    // past (negative ms)
    state = timeNowMs - timeMs;
  } else if (timeNowMs <= timeMs + MATCH_DURATION_MS) {
    // current (positive ms)
    state = timeMs + MATCH_DURATION_MS - timeNowMs;
  }

  return state;
}

function MatchCountdownView({ data, className }) {
  const [state, setState] = useState(() => getMatchTimeState(data.time));

  useEffect(() => {
    if (state) {
      const timeout = setTimeout(() => setState(getMatchTimeState(data.time)), Math.abs(state));
      return () => clearTimeout(timeout);
    }
  }, [state, data.time]);

  return state < 0 ? (
    <Uu5Elements.Text category="interface" segment="title" type="major">
      {({ style }) => (
        <Countdown dateTo={new Date(data.time)} className={Utils.Css.joinClassName(className, Config.Css.css(style))} />
      )}
    </Uu5Elements.Text>
  ) : (
    <MatchResult data={data} animation={state > 0} />
  );
}

function MatchCountdown({ data, name }) {
  return (
    <Uu5Elements.Grid.Item alignSelf={data ? "center" : undefined} gridArea={name}>
      {data ? (
        ({ style }) => <MatchCountdownView data={data} className={Config.Css.css(style)} />
      ) : (
        <Uu5Elements.Skeleton borderRadius="moderate" height="100%" width={190} />
      )}
    </Uu5Elements.Grid.Item>
  );
}

const MatchNext = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchNext",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { teamId } = props;

    const { data } = useDataObject({
      handlerMap: {
        load: () => Call.cmdGet("match/getNext", { teamId }),
      },
    });

    const contentSize = useContentSize();
    const isSmall = ["xs", "s"].includes(contentSize);

    //@@viewOn:render
    return (
      <Uu5Elements.Grid templateAreas="homeTeam countdown guestTeam, info info info" templateColumns="1fr auto 1fr">
        {({ style }) => (
          <Uu5Elements.Box
            borderRadius="moderate"
            className={Config.Css.css({ ...style, padding: "32px 24px" })}
            // height={184}
            shape="background"
            significance="distinct"
          >
            <MatchTeam data={data} name="homeTeam" align="end" displayName={!isSmall} />
            <MatchTeam data={data} name="guestTeam" displayName={!isSmall} />
            <MatchInfo data={data} name="info" />
            <MatchCountdown data={data} name="countdown" />
          </Uu5Elements.Box>
        )}
      </Uu5Elements.Grid>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchNext };
export default MatchNext;
//@@viewOff:exports
