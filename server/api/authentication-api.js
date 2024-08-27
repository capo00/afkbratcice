const keys = require('../oauth2.keys.json');

const API = {
  "auth/google": {
    method: "post",
    fn: async ({ dtoIn, session, response }) => {
      const { code } = dtoIn;

      const client_id = keys.web.client_id;
      const client_secret = keys.web.client_secret;
      const redirect_uri = "postmessage"; // must be like this, there is mistake in Google doc
      const grant_type = "authorization_code";

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id,
          client_secret,
          redirect_uri,
          grant_type,
        }),
      });

      /*
      * {
      *   "access_token": "ya29.a0AX...",
      *   "expires_in": 3599, // in seconds
      *   "refresh_token": "1//09bZs...",
      *   "scope": "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
      *   "token_type": "Bearer",
      *   "id_token": "eyJhb..."
      * }
      * */
      const tokens = await res.json();

      const res2 = await fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      /*
      * {
      *   "id": "11434...",
      *   "email": "user@gmail.com",
      *   "verified_email": true,
      *   "name": "John Smith",
      *   "given_name": "John",
      *   "family_name": "Smith",
      *   "picture": "https://lh3.googleusercontent.com/a/ACg8oc...",
      *   "locale": "cs"
      * }
      * */
      const userInfo = await res2.json();

      const { family_name, given_name, locale, verified_email, picture, ...user } = userInfo;
      const identity = { ...user, firstName: given_name, surname: family_name, language: locale, photo: picture }

      // response.session.identity = identity;
      // response.session.tokens = tokens;
      // response.session.save();
      // console.log("request.session 0", response.session);

      // response.cookie('identity', JSON.stringify(identity), { maxAge: 24 * 60 * 60 * 1000 });

      const dtoOut = identity;
      return dtoOut;
    }
  },
  "isAuth": {
    method: "get",
    fn: ({ session, request, response }) => {
      // TODO how to work with session or cookies to keep sign in after reload the page???
      // console.log("request.session", request.session);
      //
      // if (request.cookies?.aaa) {
      //   console.log("request.cookies.aaa exists", request.cookies);
      // } else {
      //   console.log("request.cookies.aaa none " + Date(), request.cookies);
      //   response.cookie('aaa', "1");
      // }

      //if (request.session?.identity) return request.session.identity
    },
  },
  "logout": {
    method: "post",
    fn: ({ session }) => {
      session.destroy();
    }
  },
}

module.exports = API;
