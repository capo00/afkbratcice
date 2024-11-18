//@@viewOn:imports
import { Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
//@@viewOff:imports

function MatchInfo({ data, name }) {
  return (
    <Uu5Elements.Grid templateColumns="1fr auto 1fr" columnGap={8} rowGap={4} alignItems="center">
      {({ style }) => (
        <Uu5Elements.Grid.Item gridArea={name} className={Config.Css.css(style)}>
          {data ? (
            <>
              <Uu5Elements.Grid.Item justifySelf="end">{data.season.competition}</Uu5Elements.Grid.Item>
              <Uu5Elements.Grid.Item rowSpan={2} alignSelf="stretch">
                {({ style }) => (
                  <Uu5Elements.Line direction="vertical" significance="subdued" className={Config.Css.css(style)} />
                )}
              </Uu5Elements.Grid.Item>
              <span>
                <Uu5Elements.DateTime value={data.time} format="dddd" />
              </span>
              <Uu5Elements.Grid.Item justifySelf="end">
                {data.round ? (
                  <>
                    {data.round}. <Lsi lsi={{ cs: "kolo" }} />
                  </>
                ) : (
                  <Lsi lsi={{ cs: "přátelský" }} />
                )}
              </Uu5Elements.Grid.Item>
              <span>
                <Uu5Elements.DateTime value={data.time} format="D. MMMM HH:mm" />
              </span>
            </>
          ) : (
            Array.from({ length: 6 }, (_, i) => <Uu5Elements.Skeleton key={i} borderRadius="moderate" />)
          )}
        </Uu5Elements.Grid.Item>
      )}
    </Uu5Elements.Grid>
  );
}

//@@viewOn:exports
export { MatchInfo };
export default MatchInfo;
//@@viewOff:exports
