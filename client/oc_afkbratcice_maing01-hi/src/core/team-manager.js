//@@viewOn:imports
import {
  createComponent,
  ErrorBoundary,
  PropTypes,
  useRoute,
  useRouter,
  useSession,
  Suspense,
  useDataList,
} from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Uu5CodeKit from "uu5codekitg01";
import Config from "./config/config.js";
import Calls from "../calls";
//@@viewOff:imports

//@@viewOn:helpers
//@@viewOff:helpers

const TeamManager = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "TeamManager",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const dataList = useDataList({
      handlerMap: {
        load: Calls.loadTeams,
      },
    });
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const { state, data } = dataList;

    let result;
    switch (state) {
      case "pendingNoData":
        result = <Uu5Elements.Pending />;
        break;
      case "ready":
        // TODO use tiles for CRUD
        result = <Uu5CodeKit.Json.Input value={data} onChange={() => {}} format="pretty" minRows={7} maxRows={50} />;
        break;
      default:
        console.log("Unexpected state: " + state, dataList);
        result = state;
    }

    return result;
    //@@viewOff:render
  },
});

export { TeamManager };
export default TeamManager;
