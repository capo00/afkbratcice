var webpack = require("webpack");
var fs = require("fs-extra");
var path = require("path");
var buildHelpers = require("./helpers.js");

var pkg = require("../package.json");
var uuapp = require('../../app.json');
for(var uuAppKey in uuapp) pkg[uuAppKey] = uuapp[uuAppKey];
var json = JSON.stringify(pkg, null, 2);
fs.writeFileSync('package.json', json);

fs.emptyDirSync(".tmp");

var config = require("../config/config.js").getConfig();
var src = config.sourcePath || "src";
var dest = config.outputPath || "dist";
var srcLib = path.join(src, "lib");
fs.emptyDirSync(dest);

// resolve which URIs to use for dependencies and copy dependencies
// to <destination>/lib/<depName>-<depVersion>/ folders if needed
console.log("Copying dependencies...");
if (!config.dependencies) config.dependencies = {};
if (Object.keys(config.dependencies).length > 0) {
  var srcLibs = (fs.existsSync(srcLib) ? fs.readdirSync(srcLib) : null) || [];
  var srcLibsMap = {};
  srcLibs.forEach(lib => srcLibsMap[lib.replace(/-(\d+)(\.\d+)*$/, "")] = lib);
  var copiedMap = {};
  for (var depName in config.dependencies) {
    var depConfig = config.dependencies[depName];
    var depBaseUri = (config.useCdn ? depConfig.cdnBaseUri : null) || depConfig.localBaseUri;
    var usedBaseUri =  depConfig.baseUri;
    if (usedBaseUri == null && depBaseUri) {
      if (depBaseUri.match(/^(\/|https?:)/)) { // full URL / absolute URL path => just use the URL (no copying of files)
        usedBaseUri = depBaseUri;
      } else if (copiedMap[depBaseUri]) { // source folder that was already copied to some target folder => reuse
        usedBaseUri = copiedMap[depBaseUri];
      } else {
        // copy to <destination>/lib/<depName>-<depVersion> if it's local path;
        // the URL will then be <appAssets>/lib/<depName>-<depVersion>
        var depTargetFldName;
        if (srcLibsMap[depName]) depTargetFldName = srcLibsMap[depName];
        else depTargetFldName = depName + "-" + buildHelpers.getPackageJson(depName, {version: '0.0.0'}).version;
        usedBaseUri = "lib/" + depTargetFldName + "/";
        if (!srcLibsMap[depName]) {
          var targetDir = dest + "/lib/" + depTargetFldName;
          fs.copySync(depBaseUri, targetDir);
        }
        copiedMap[depBaseUri] = usedBaseUri;
      }
    }

    delete depConfig.cdnBaseUri;
    delete depConfig.localBaseUri;
    depConfig.baseUri = usedBaseUri || false;
    var main = (config.isProductionBuild ? depConfig.mainMinified : "") || depConfig.main || (depName + (config.isProductionBuild ? ".min" : "") + ".js");
    depConfig.main = main;
    delete depConfig.mainMinified;
  }

  // NOTE Contents of src/lib/** is copied by webpack.
}

// write resolved configuration
fs.writeFileSync(".tmp/config.json", JSON.stringify(config, null, "  "), "utf-8");

// show summary & run webpack if necessary
summarize(config);
let skipWebpack = (process.argv.slice(2).indexOf("--skip-webpack") !== -1);
if (!skipWebpack) doWebpackBuild(config);

function doWebpackBuild(config, callback) {
  console.log("Running webpack...");
  var webpackConfig = require("./webpack.config.js");
  webpack(webpackConfig, function (err, statsObj) {
    if (err) {
      console.error(err);
      return callback ? callback(err) : err;
    }

    // show standard output of webpack (if there're errors)
    var stats = statsObj.toJson();
    console.log(statsObj.toString(true));
    if (stats.errors.length > 0) {
      return callback ? callback(stats.errors[0]) : stats.errors[0];
    }

    if (callback) callback();
  });
}

function summarize(config, err) {
  if (err) return;

  // show configuration summary
  var deps = config.dependencies;
  var externalDeps = {};
  var externalDepsInfo = Object.keys(deps).filter(depName => deps[depName].baseUri && typeof deps[depName].baseUri === "string" && !depName.startsWith("app/")).map(depName => {
    var dep = deps[depName];
    externalDeps[depName] = dep;
    var paddedDepName = (depName + "                     ").substr(0, Math.max(19, depName.length));
    return `${paddedDepName} - ${dep.baseUri}${dep.main}`;
  }).join("\n") || "<none>";
  var bundledDepsInfo = Object.keys(pkg.dependencies||{})
    .filter(depName => !externalDeps[depName] && !depName.startsWith("systemjs-plugin-")) // hide SystemJS plugins
    .join("\n") || "<none>";
  var inBrowserEnvInfo = `loaded from URL: %APP_BASE%/${config.appAssetsRelativeUrlPath||""}uu5-environment.js`;
  console.log(`
BUILD SUMMARY
In-browser environment:
${inBrowserEnvInfo.replace(/(^|\n)/g, "$1  ")}

External dependencies:
${externalDepsInfo.replace(/(^|\n)/g, "$1  ")}

Dependencies from package.json bundled directly into main JS file (if imported):
${bundledDepsInfo.replace(/(^|\n)/g, "$1  ")}
`);
}
