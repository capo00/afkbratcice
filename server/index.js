const path = require("path");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');
const playerDao = require("./dao/player-dao");
const teamDao = require("./dao/team-dao");
const theChaseApi = require("./the-chase/api");
const Tools = require("./the-chase/tools")
const { OAuth2Client } = require('google-auth-library');

const PORT = process.env.PORT || 8080;

const CLIENT_ID = "320438662814-hgjqtc69jbs4d7ec9mgo9efnkp2oioj0.apps.googleusercontent.com"; // Replace with your actual Client ID
const oAuth2Client = new OAuth2Client(CLIENT_ID);

const app = express();
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

if (process.env.NODE_ENV !== "production") {
  const allowedOrigins = ["http://localhost:1234", "http://192.168.88.91:1234", "http://192.168.88.12:1234"]
  app.use(cors({
    origin(origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not ' +
          'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    }
  }));
}

function deserializeDtoIn(dtoIn) {
  const newDtoIn = {};
  for (let k in dtoIn) {
    if (typeof dtoIn[k] === "string" && /^[{\[]/.test(dtoIn[k])) {
      try {
        newDtoIn[k] = JSON.parse(dtoIn[k]);
      } catch (e) {
        newDtoIn[k] = dtoIn[k];
      }
    } else newDtoIn[k] = dtoIn[k];
  }
  return newDtoIn;
}

app.use(express.static(path.resolve(__dirname, "../public")));

app.get("/team/list", async (req, res) => {
  const dtoIn = deserializeDtoIn(req.query);

  // TODO cannot connect in deployed app :-( server google cannot connect to mongodb

  const itemList = await teamDao.list();

  if (process.env.NODE_ENV !== "production") {
    // because of cors on localhost
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }

  res.json({ itemList });
});

let theChaseMap = {};

const API = {
  ...theChaseApi,
}

for (let uc in API) {
  const { method, fn } = API[uc];
  // const reqId = Tools.generateId();

  app[method]("/" + uc, async (req, res) => {
    const dtoIn = method === "get" ? deserializeDtoIn(req.query) : req.body;

    try {
      // console.info(`{${reqId}}[${new Date().toISOString()}](${method}) /${uc} start`, dtoIn);
      const dtoOut = fn(dtoIn);
      // console.info(`{${reqId}}[${new Date().toISOString()}](${method}) /${uc} end`, dtoOut);

      res.json(dtoOut);
    } catch (e) {
      console.error(`[${new Date().toISOString()}](${method}) /${uc} Unexpected exception. dtoIn = `, dtoIn, e);
      res.status(500).send({ message: "Unexpected exception", error: e });
    }
  });
}

app.post('/verify', async (req, res) => {
  const token = req.body.token;

  try {
    // TODO not work :-( throw error "The verifyIdToken method requires an ID Token"
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userId = payload['sub'];
    console.log(payload);

    res.json({
      success: true,
      userId,
      userInfo: payload,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
