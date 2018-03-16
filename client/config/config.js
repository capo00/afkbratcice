var fs = require("fs-extra");
var path = require("path");
var buildHelpers = require("../tools/helpers.js");
var pkg = require("../package.json");

module.exports.getConfig = function () {
  "use strict"; // To avoid: Uncaught SyntaxError: Block-scoped declarations (let, const, function, class) not yet supported outside strict mode
  let isProductionBuild = (process.env.NODE_ENV == "production");
  let serverDirName = buildHelpers.getServerDirName();
  let isWithoutServer = !fs.existsSync("../" + serverDirName);
  let infix = (isProductionBuild ? ".min" : "");

  let srcDir = "src";
  let useMockData = true;
  let config = {
    isProductionBuild: isProductionBuild,
    useMockData: useMockData,

    // server/browser settings
    host: "0.0.0.0",
    port: 1112,
    https: false,
    autoOpenInBrowser: false,
    devServerAppBaseUrlPath: "",

    // build settings
    sourcePath: srcDir,
    outputPath: (isWithoutServer ? "public" : `../${serverDirName}/public`), // file system folder to build files to
    entryPoints: buildHelpers.getHtmlFilesFromMappingsJson()
                    .map(html => html.replace(/\.html?$/i, ".js"))
                    .filter(jsFile => fs.existsSync(path.join(srcDir, jsFile))), // files to build (relative to "src/", resp. sourcePath)
    minify: isProductionBuild,
    useSourceMaps: true,

    // routing settings
    // absolute URL path of the application root where app will be deployed on web server (typically "/" for app on a custom domain);
    // this must be configured only in case that client-side router is used and nested routes (routes in subfolders)
    // are required to work
    appBaseUrlPath: (isWithoutServer ? "/" : "<preserve-2-path-segments>"),
    appAssetsRelativeUrlPath: (isWithoutServer ? "" : "public/" + pkg.version + "/"), // URL path (relative to appBaseUrlPath) where built client-side files are deployed

    // additional aliases usable in "import" statements in JS or CSS
    aliases: {
      "calls": ((!isProductionBuild && useMockData) ? path.resolve(srcDir, "../test/mocks.js") : path.resolve(srcDir, "calls.js")),
      "ns": buildHelpers.createNamespaceAliasFileForJs(),
      "cssns": buildHelpers.createNamespaceAliasFileForCss(),
    }
  };

  // merge with build settings in package.json
  if (pkg.uuBuildSettings) config = Object.assign({}, pkg.uuBuildSettings, config);

  // replace %version% strings in dependencies
  if (config.dependencies) {
    for (var k in config.dependencies) {
      var v = config.dependencies[k];
      if (!v || typeof v !== "object") continue;
      var version = getPackageJson(k, { version: "0.0.0" }).version;
      if (v.cdnBaseUri) v.cdnBaseUri = v.cdnBaseUri.replace(/%version%/gi, () => version);
      if (v.localBaseUri) v.localBaseUri = v.localBaseUri.replace(/%version%/gi, () => version);
      if (v.main) v.main = v.main.replace(/%version%/gi, () => version);
      if (v.mainMinified) v.mainMinified = v.mainMinified.replace(/%version%/gi, () => version);
    }
  }

  // allow project packages (src/<pack>/<pack>.js) to be loaded as external dependency (in separate on-demand HTTP request)
  // when developer uses "import * as Pack from 'app/<pack>'" or "SystemJS.import('app/<pack>').then(function (exports) { ... })"
  // in the source code
  var packages = buildHelpers.getProjectPackageList(config.sourcePath);
  if (!config.aliases) config.aliases = {};
  if (!config.dependencies) config.dependencies = {};
  packages.forEach(pack => {
    config.aliases[pack.moduleName] = path.resolve(config.sourcePath, pack.entryPoint);
    config.dependencies[pack.moduleName] = {
      baseUri: pack.directory + "/",
      main: pack.name + infix + ".js"
    };
  });

  return config;
};

function getPackageJson(depName, defaultValue) {
  return buildHelpers.getPackageJson(depName, defaultValue);
}
