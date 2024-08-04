const Path = require("path");

const devkitConfigPath = require.resolve("uu5devkitg01-plugin/src/config/.eslintrc.js", { paths: [__dirname] });

const config = {
  extends: ["./" + Path.relative(__dirname, devkitConfigPath).replace(/\\/g, "/")],
};

module.exports = config;
