import { createContext, useContext, useState, useMemo, useEffect } from "react";

const CMD_PREFIX = "/auth";

const SessionContext = createContext({});

function SessionProvider(props) {
  const [identity, setIdentity] = useState();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(CMD_PREFIX, {
          method: "GET",
          credentials: "include", // Important: This ensures cookies are sent with the request
        });

        if (response.status === 200) {
          const data = await response.json();
          setIdentity(data.identity);
        } else {
          setIdentity(null);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIdentity(null);
      }
    };

    checkAuthStatus();
  }, []);

  const value = useMemo(() => {
    let { exp, iat, ...params } = identity || {};
    if (!identity) params = identity;
    return {
      identity: params,
      state: identity === undefined ? "pending" : identity === null ? "notAuthenticated" : "authenticated",
      login() {
        window.OcAuth = { loggedIn: ({ identity }) => setIdentity(identity) };

        const width = Math.min(window.innerWidth, 600);
        const height = Math.min(window.innerHeight, 870);
        window.open(CMD_PREFIX + "/google", null, `top=${window.innerHeight / 2 - height / 2},left=${window.innerWidth / 2 - width / 2},width=${width},height=${height}`);
      },
      async logout() {
        await fetch(CMD_PREFIX + "/logout", {
          method: "POST",
          credentials: "include", // This ensures cookies are sent with the request
        });
        setIdentity(null);
      }
    };
  }, [identity]);

  return (
    <SessionContext.Provider value={value}>
      {props.children}
    </SessionContext.Provider>
  )
}

function useSession() {
  return useContext(SessionContext);
}

export { SessionProvider, useSession };
