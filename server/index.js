const path = require("path");
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const afkApi = require("./api");
const theChaseApi = require("./the-chase/api");

const PORT = process.env.PORT || 8080;

const app = express();
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(session({
  secret: "afkbratcice",
  saveUninitialized: true,
  resave: true
}));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  const allowedOrigins = ["http://localhost:1234", "http://192.168.88.91:1234", "http://192.168.88.12:1234"]
  app.use(cors({
    origin(origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
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

const API = {
  ...theChaseApi,
  ...afkApi,
}

for (let uc in API) {
  const { method, fn } = API[uc];
  // const reqId = Tools.generateId();

  app[method]("/" + uc, async (req, res) => {
    const dtoIn = method === "get" ? deserializeDtoIn(req.query) : req.body;

    try {
      // console.info(`{${reqId}}[${new Date().toISOString()}](${method}) /${uc} start`, dtoIn);
      const dtoOut = await fn({ dtoIn, request: req, response: res, method, useCase: uc, session: req.session });
      // console.info(`{${reqId}}[${new Date().toISOString()}](${method}) /${uc} end`, dtoOut);

      res.json(dtoOut == null ? {} : dtoOut);
    } catch (e) {
      console.error(`[${new Date().toISOString()}](${method}) /${uc} Unexpected exception. dtoIn = `, dtoIn, e);
      res.status(500).send({ message: "Unexpected exception", error: e });
    }
  });
}

// All other GET requests not handled before will return our React app
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
