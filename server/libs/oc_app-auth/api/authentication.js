const jwt = require("jsonwebtoken");
const Config = require("../config/config");

async function authentication(req, res, next) {
  const token = req.cookies.token; // Retrieve the token from the cookie

  if (!token) {
    return res.status(401).json({ error: { code: Config.ERROR_PREFIX + "unauthenticated", message: "Not authenticated" } });
  }

  let identity = null;
  try {
    identity = jwt.verify(token, Config.token.jwtSecret);
  } catch (error) {
    return res.status(401).json({
      error: {
        code: Config.ERROR_PREFIX + "invalidToken",
        message: "Token is not valid",
        cause: error,
      }
    });
  }

  req.identity = identity;
  next();
}

module.exports = authentication;
