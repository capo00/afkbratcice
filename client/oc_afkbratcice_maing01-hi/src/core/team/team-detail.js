//@@viewOn:imports
import { createVisualComponent, useDataObject } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { Call } from "../../libs/oc_cli-elements";
//@@viewOff:imports

const TeamDetail = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamDetail",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { id, ...blockProps } = props;

    const { state, data } = useDataObject({
      handlerMap: {
        load: () => Call.cmdGet("team/get", { id }),
      },
    });

    let header, children;

    if (state === "pendingNoData") {
      header = <Uu5Elements.Skeleton borderRadius="moderate" />;
      children = <Uu5Elements.Pending size="max" />;
    } else {
      header = data.name;
      // TODO
      children = "TODO";
    }

    //@@viewOn:render
    return (
      <Uu5Elements.Block {...blockProps} headerType="heading" header={header}>
        {children}
      </Uu5Elements.Block>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { TeamDetail };
export default TeamDetail;
//@@viewOff:exports
