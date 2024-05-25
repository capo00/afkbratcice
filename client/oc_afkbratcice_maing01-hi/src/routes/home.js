//@@viewOn:imports
import { GoogleOAuthProvider, useGoogleLogin, googleLogout, useGoogleOneTapLogin } from "@react-oauth/google";
import { Utils, createVisualComponent, useRef, useMemo, useState, useCallback } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import TeamManager from "../core/team-manager";

import Config from "./config/config.js";
import Calls from "../calls";
//@@viewOff:imports

//@@viewOn:constants
const CLIENT_ID = "320438662814-hgjqtc69jbs4d7ec9mgo9efnkp2oioj0.apps.googleusercontent.com"; // Replace with your actual Client ID
//@@viewOff:constants

//@@viewOn:css
//@@viewOff:css

//@@viewOn:helpers
const [GoogleContext, useGoogle] = Utils.Context.create({});

function _GoogleProvider({ children }) {
  const [identity, setIdentity] = useState(null);

  const onSuccess = useCallback(
    async (user) => {
      const { family_name, given_name, locale, verified_email, picture, ...data } = await Calls.call(
        "get",
        "https://www.googleapis.com/oauth2/v1/userinfo",
        { access_token: user.access_token },
        {
          headers: {
            Authorization: `Bearer ${user.access_token}`,
            Accept: "application/json",
          },
        },
      );
      setIdentity({ ...data, firstName: given_name, surname: family_name, language: locale, photo: picture });
    },
    [setIdentity],
  );

  const onError = useCallback((error) => console.error("Login Failed:", error), []);

  const login = useGoogleLogin({ onSuccess, onError });

  const onSuccess2 = useCallback(
    async (response) => {
      const id_token = response.credential;

      try {
        const res = await Calls.call("post", Calls.getCommandUri("verify"), {
          token: id_token,
        });
        console.log(res);

        if (res.data.success) {
          console.log('User authenticated:', res.data.userInfo);
        } else {
          console.error('Authentication failed:', res.data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
      //setIdentity({ ...data, firstName: given_name, surname: family_name, language: locale, photo: picture });
    },
    [setIdentity],
  );

  useGoogleOneTapLogin({ onSuccess: onSuccess2, onError, auto_select: true });

  const value = useMemo(
    () => ({
      // state,
      login: () => login(),
      logout: () => {
        setIdentity(null);
        googleLogout();
      },
      identity,
      onSuccess,
      onError,
    }),
    [identity, onSuccess, onError, login],
  );

  return (
    <GoogleContext.Provider value={value}>
      {typeof children === "function" ? children(value) : value}
    </GoogleContext.Provider>
  );
}

function GoogleProvider({ clientId, children }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <_GoogleProvider>{children}</_GoogleProvider>
    </GoogleOAuthProvider>
  );
}
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
        <GoogleProvider clientId={CLIENT_ID} loginCmdUri={Calls.getCommandUri("auth/google/login")}>
          {({ login, identity, logout, onSuccess, onError }) =>
            identity ? (
              <>
                <Uu5Elements.InfoItem imageSrc={identity.photo} title={identity.name} />
                <Uu5Elements.Button
                  colorScheme="negative"
                  icon="uugdsstencil-uiaction-log-out"
                  onClick={() => logout()}
                />
                <pre>{JSON.stringify(identity, null, 2)}</pre>
              </>
            ) : (
              <>
                <Uu5Elements.Button onClick={() => login()}>Login by Google</Uu5Elements.Button>
              </>
            )
          }
        </GoogleProvider>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Home };
export default Home;
//@@viewOff:exports
