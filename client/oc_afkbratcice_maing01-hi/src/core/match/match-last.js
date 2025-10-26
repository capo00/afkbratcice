//@@viewOn:imports
import { createVisualComponent, useContentSize, useDataObject, Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import OcElements from "../../libs/oc_cli-elements";
import MatchInfo from "./match-info";
import MatchTeam from "./match-team";
import MatchResult from "./match-result";
//@@viewOff:imports

const MatchLast = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "MatchLast",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { teamId, className, ...restProps } = props;

    const { data } = useDataObject({
      handlerMap: {
        load: () => OcElements.Call.cmdGet("match/getLast", { teamId }),
      },
    });

    const contentSize = useContentSize();
    const isSmall = ["xs", "s"].includes(contentSize);

    const space = Uu5Elements.useSpacing();

    const boxProps = { ...restProps, borderRadius: "moderate", shape: "background", significance: "distinct", className: Utils.Css.joinClassName(className, Config.Css.css({ paddingBlock: space.d, paddingInline: space.c })), /* height: 184 */ };

    //@@viewOn:render
    return !data || Object.keys(data).length > 0 ? (
      <Uu5Elements.Grid templateAreas="homeTeam result guestTeam, info info info" templateColumns="1fr auto 1fr">
        {({ style }) => (
          <Uu5Elements.Box
            {...boxProps}
            className={Utils.Css.joinClassName(boxProps.className, Config.Css.css(style))}
          >
            <MatchTeam data={data} name="homeTeam" align="end" displayName={!isSmall} />
            <MatchTeam data={data} name="guestTeam" displayName={!isSmall} />
            <MatchInfo data={data} name="info" />
            <MatchResult data={data} name="result" />
          </Uu5Elements.Box>
        )}
      </Uu5Elements.Grid>
    ) : (
      <Uu5Elements.Box {...boxProps}>
        Žádný poslední zápas
      </Uu5Elements.Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { MatchLast };
export default MatchLast;
//@@viewOff:exports
