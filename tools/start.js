function run() {
  // Set NODE_ENV to development before spawning the processes
  process.env.NODE_ENV = "development";

  // Start server
  require("child_process").spawn("nodemon", ["server/index.js"], { shell: true, stdio: "inherit" });

  // Start client in a separate directory with npm
  require("child_process").spawn("npm", ["start"], { shell: true, cwd: require("path").resolve("client/oc_afkbratcice_maing01-hi"), stdio: "inherit" });
}

run();
