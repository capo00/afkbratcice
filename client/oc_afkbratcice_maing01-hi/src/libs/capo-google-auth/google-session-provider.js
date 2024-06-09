//@@viewOn:imports
import { GoogleOAuthProvider, useGoogleLogin, googleLogout } from "@react-oauth/google";
import { useCallback, useEffect, useMemo, useState } from "uu5g05";
import GoogleSessionContext from "./google-session-context";
import Calls from "../../calls";

//@@viewOff:imports

function _GoogleProvider({ children }) {
  const [identity, setIdentity] = useState();

  const onSuccess = useCallback(
    async (codeResponse) => {
      const identity = await Calls.call(
        "post",
        Calls.getCommandUri("auth/google"),
        { code: codeResponse.code },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setIdentity(identity);
    },
    [setIdentity],
  );

  const onError = useCallback((error) => console.error("Login Failed:", error), []);

  const login = useGoogleLogin({ onSuccess, onError, flow: "auth-code" });

  const value = useMemo(
    () => ({
      state: identity === undefined ? "pending" : identity ? "authenticated" : "notAuthenticated",
      login: () => login(),
      logout: () => {
        setIdentity(null);
        googleLogout();
        Calls.call("post", Calls.getCommandUri("logout"));
      },
      identity,
      onSuccess,
      onError,
    }),
    [identity, onSuccess, onError, login],
  );

  useEffect(() => {
    (async function () {
      const identity = await Calls.call("get", Calls.getCommandUri("isAuth"));
      setIdentity(identity?.id ? identity : null);
    })();
  }, []);

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
