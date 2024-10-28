import { createComponent, useDataObject, Utils } from "uu5g05";
import OcElements from "../../libs/oc_cli-elements";
import Config from "../config/config";

const [AppContext, useApp] = Utils.Context.create();

const AppProvider = createComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "AppProvider",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { children } = props;

    const dto = useDataObject({
      handlerMap: {
        load: () => OcElements.Call.cmdGet("app/get"),
        update: (data) => OcElements.Call.cmdPost("app/update", data),
      },
    });

    //@@viewOn:render
    return (
      <AppContext.Provider value={dto}>{typeof children === "function" ? children(dto) : children}</AppContext.Provider>
    );
    //@@viewOff:render
  },
});

export { AppProvider, useApp };
