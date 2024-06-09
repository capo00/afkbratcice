//@@viewOn:imports
import { GoogleLogin } from "@react-oauth/google";
import { Utils, createVisualComponent, useRef, useMemo, useState, useCallback } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import TeamManager from "../core/team-manager";
import Config from "./config/config.js";
import Calls from "../calls";
import { GoogleSessionProvider } from "../libs/capo-google-auth/index";
//@@viewOff:imports

//@@viewOn:constants
const CLIENT_ID = "320438662814-hgjqtc69jbs4d7ec9mgo9efnkp2oioj0.apps.googleusercontent.com"; // Replace with your actual Client ID
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

let Home = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Home",
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

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props);
    return (
      <div {...attrs}>
        {/*<TeamManager />*/}
        <GoogleSessionProvider clientId={CLIENT_ID}>
          {({ login, identity, logout, onSuccess, onError }) =>
            identity ? (
              <>
                <Uu5Elements.InfoItem imageSrc={identity.photo} title={identity.name} />
                <Uu5Elements.Button
                  colorScheme="negative"
                  icon="uugdsstencil-uiaction-log-out"
                  onClick={() => logout()}
                />
                <Uu5Elements.Button
                  colorScheme="negative"
                  onClick={async () => {
                    const res = await Calls.call("get", Calls.getCommandUri("isAuth"));
                    console.log(res);
                  }}
                >
                  is auth
                </Uu5Elements.Button>
                <pre>{JSON.stringify(identity, null, 2)}</pre>
              </>
            ) : (
              <>
                <Uu5Elements.Button onClick={() => login()}>Login by Google</Uu5Elements.Button>
                <GoogleLogin onSuccess={onSuccess} onError={onError} type="icon" flow="auth-code" />

                <Uu5Elements.Button
                  onClick={async () => {
                    const res = await Calls.call("get", Calls.getCommandUri("team/list"));
                    console.log(res);
                  }}
                >
                  team/list
                </Uu5Elements.Button>
              </>
            )
          }
        </GoogleSessionProvider>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Home };
export default Home;
//@@viewOff:exports
