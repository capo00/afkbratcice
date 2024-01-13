const path = require("path");
const express = require("express");
const playerDao = require("./dao/player-dao");
const teamDao = require("./dao/team-dao");

const PORT = process.env.PORT || 8080;

const app = express();

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

  if (!process.env.NODE_ENV !== "production") {
    // because of cors on localhost
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }

  res.json({ itemList });
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
