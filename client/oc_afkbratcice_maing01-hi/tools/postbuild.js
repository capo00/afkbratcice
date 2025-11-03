const fs = require("fs");

function postbuild() {
  fs.cpSync("src/service-worker.js", "public/service-worker.js");
}

postbuild();
