const path = require("path");
const express = require("express");
const playerDao = require("./dao/player-dao");

const PORT = process.env.PORT || 8080;

const app = express();

app.use(express.static(path.resolve(__dirname, "../public")));

app.get("/api", async (req, res) => {
  const c = await playerDao.get("64cd6ca820a0cf5b33ad4fb8");

  res.json(c);
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, "../public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
