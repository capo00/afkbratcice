//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import Config from "./config/config.js";
import { SpaProvider, Spa as SpaView } from "../libs/oc_cli-app";
import Page from "../libs/oc_cli-app/page";
import TurnamentRoute from "./turnament-route.js";
import TurnamentDetail from "./turnament-detail.js";
import Router from "../core/router.js";
//@@viewOff:imports

//@@viewOn:constants
const ROUTE_MAP = {
  turnament: (props) => <TurnamentRoute {...props} />,
  "turnament/detail": (props) => <TurnamentDetail {...props} id={props.params.id} />,

  "*": () => (
    <Uu5Elements.Text category="story" segment="heading" type="h1">
      Not Found
    </Uu5Elements.Text>
  ),
};
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Spa = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Spa",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    //@@viewOff:private

    //@@viewOn:render
    return (
      <SpaProvider>
        <SpaView>
          <Page menuList={[{ key: "identity" }]}>
            <Router routeMap={ROUTE_MAP} />
          </Page>
        </SpaView>
      </SpaProvider>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Spa };
export default Spa;
//@@viewOff:exports
