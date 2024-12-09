const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Identity = require("../abl/identity");
const Config = require("../config/config");
const fs = require("fs");

module.exports = {
  init(prefixPath = "") {
    const router = express.Router();

    function setToken(res, token) {
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    }

    function removeToken(res) {
      // Clear the cookie by setting an empty value and an expired date
      res.clearCookie("token", {
        httpOnly: true,
        secure: true, // ensure "secure" is true in production to only send the cookie over HTTPS
        sameSite: "strict",
      });
    }

    router.get("/", async (req, res) => {
      const token = req.cookies.token; // Retrieve the token from the cookie

      let identity = null;
      if (token) {
        try {
          identity = jwt.verify(token, Config.token.jwtSecret);
        } catch (error) {
          //console.warn("/auth: Token is not valid", error);
        }
      }
      return res.json({ identity });
    });

// Register
    router.post("/register", async (req, res) => {
      const { firstName, surname, email, password } = req.body;

      try {
        let identity = await Identity.getByEmail(email);

        if (identity) {
          return res.status(400).json({ message: "Identity already exists" });
        }

        identity = await Identity.create({ name: [firstName, surname].join(" "), firstName, surname, email, password });
        setToken(res, Identity.createToken(identity));

        res.status(201).json({ identity });
      } catch (err) {
        console.error("/auth/register: Unexpected exception", err);
        res.status(500).json({
          error: {
            code: Config.ERROR_PREFIX + "unexpected",
            message: "Unexpected exception",
            cause: err
          }
        });
      }
    });

// Login
    router.post("/login", async (req, res) => {
      const { email, password } = req.body;

      try {
        const identity = await Identity.getByEmail(email);

        if (!identity) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await Identity.matchPassword(password, identity.password);

        if (!isMatch) {
          return res.status(400).json({ message: "Invalid credentials" });
        }

        setToken(res, Identity.createToken(identity));

        res.json({ identity });
      } catch (err) {
        console.error("/auth/login: Unexpected exception", err);
        res.status(500).json({
          error: {
            code: Config.ERROR_PREFIX + "unexpected",
            message: "Unexpected exception",
            cause: err
          }
        });
      }
    });

    router.post("/logout", async (req, res) => {
      removeToken(res);
      res.json({});
    });

// Google Auth
    let callbackURL;
    router.get("/google", (req, res, next) => {
      const domain = req.headers.referer;
      const uc = prefixPath + "/" + Config.google.callbackUc;
      // callbackURL must start with https if the server runs on https
      callbackURL = domain ? new URL(uc, domain).toString() : uc;
      return passport.authenticate("google", { scope: ["profile", "email"], callbackURL })(req, res, next);
    });
    router.get(
      "/" + Config.google.callbackUc,
      (req, res, next) => {
        // callbackURL must be same as for login
        return passport.authenticate("google", { session: false, callbackURL })(req, res, next);
      },
      (req, res) => {
        setToken(res, Identity.createToken(req.user));
        fs.readFile(__dirname + "/../assets/callback.html", "utf8", (err, text) => {
          res.send(text.replace("%s", JSON.stringify(Identity.getBasicData(req.user))));
        });
      }
    );

    return router;
  }
};
