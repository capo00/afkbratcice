//@@viewOn:imports
import { GoogleOAuthProvider, useGoogleLogin, googleLogout, useGoogleOneTapLogin } from "@react-oauth/google";
import { createComponent, useCallback, useMemo, useState } from "uu5g05";
import GoogleSessionContext from "./google-session-context";
import Calls from "../../calls";

//@@viewOff:imports

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
        }
      );
      setIdentity({ ...data, firstName: given_name, surname: family_name, language: locale, photo: picture });
    },
    [setIdentity]
  );

  const onError = useCallback((error) => console.error("Login Failed:", error), []);

  const login = useGoogleLogin({ onSuccess, onError });

  //useGoogleOneTapLogin({ onSuccess, onError });

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
    [identity, onSuccess, onError, login]
  );

  return (
    <GoogleSessionContext.Provider value={value}>
      {typeof children === "function" ? children(value) : value}
    </GoogleSessionContext.Provider>
  );
}

function GoogleSessionProvider({ clientId, children }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <_GoogleProvider>{children}</_GoogleProvider>
    </GoogleOAuthProvider>
  );
}

//@@viewOn:exports
export { GoogleSessionProvider };
export default GoogleSessionProvider;
//@@viewOff:exports
