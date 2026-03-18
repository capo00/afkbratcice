//@@viewOn:imports
import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5Extras from "uu5extrasg01";
import OcAuth from "../libs/oc_cli-auth";
import Config from "./config/config.js";
import { Call } from "../libs/oc_cli-elements/index.js";
import MatchList from "./match-list.js";
import StandingsList from "./standings-list.js";
import TeamOverview from "./team-overview.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
function getTurnamentActionList(dto, identity) {
  const { data, handlerMap } = dto;
  const isAuth = identity?.profileList?.includes?.("authorities") && data?.owner === identity?.identity;
  const isOperative = data?.operativeList?.includes?.(identity?.identity);
  const canManage = isAuth || isOperative;

  if (!canManage) return undefined;

  const actionList = [];

  if (data?.state === "initial") {
    actionList.push({
      icon: "uugds-calendar",
      children: "Vytvořit rozpis",
      onClick: async () => {
        await handlerMap.createSchedule();
        handlerMap.load();
      },
    });
  }

  return actionList.length > 0 ? actionList : undefined;
}
//@@viewOff:helpers

const TurnamentDetail = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TurnamentDetail",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { id } = props;

    const session = OcAuth.useSession();

    const dto = useDataObject({
      handlerMap: {
        load: () => Call.cmdGet("turnament/get", { id }),
        update: (dtoIn) => Call.cmdPost("turnament/update", { ...dtoIn, id }),
        updateData: (dtoIn) => Call.cmdPost("turnament/updateData", { ...dtoIn, id }),
        setResult: (dtoIn) => Call.cmdPost("turnament/setResult", { ...dtoIn, id }),
        createSchedule: () => Call.cmdPost("turnament/createSchedule", { id }),
      },
    });
    //@@viewOff:private

    //@@viewOn:render
    return dto.state === "pendingNoData"
      ? <Uu5Elements.Pending size="xl" />
      : (
        <Uu5Elements.Block headerType="heading" header={dto.data.name} actionList={getTurnamentActionList(dto, session.identity)}>
          <Uu5Elements.Grid>
            <Uu5Elements.InfoGroup itemList={[
              { icon: "uugds-calendar", title: <Uu5Elements.DateTime value={dto.data.date} timeFormat="none" />, subtitle: "Datum" },
              dto.data.place ? { icon: "uugds-calendar", title: dto.data.place, subtitle: "Místo" } : null,
            ].filter(Boolean)} />
            {dto.data.matchList && <MatchList dto={dto} />}
            {dto.data.matchList && (
              <StandingsList
                key={id + "-" + (dto.data.matchList?.filter((m) => m.result).length ?? 0)}
                turnamentId={id}
              />
            )}
            <TeamOverview dto={dto} />
            <Uu5Extras.QRCode value={location.href} />
          </Uu5Elements.Grid>
        </Uu5Elements.Block>
      );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TurnamentDetail };
export default TurnamentDetail;
//@@viewOff:exports
