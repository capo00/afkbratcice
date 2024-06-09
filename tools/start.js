function run() {
  require("child_process").spawn("nodemon", ["server/index.js"], { shell: true, stdio: "inherit" });
  require("child_process").spawn("npm", ["start"], { shell: true, cwd: require("path").resolve("client/oc_afkbratcice_maing01-hi"), stdio: "inherit" });
}

run();
