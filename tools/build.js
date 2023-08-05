const fs = require("fs");

function build() {
  fs.cpSync("client/oc_afkbratcice_maing01-hi/public", "./public", { recursive: true });
}

build();
