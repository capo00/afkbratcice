var path = require("path");
var fs = require("fs-extra");
var CopyWebpackPlugin = require('copy-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var WriteFilePlugin = require('write-file-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require("webpack");

var pkg = require("../package.json");

function fillDefaults(opts) {
  if (opts.minify == null) opts.minify = false;
  if (opts.useSourceMaps == null) opts.useSourceMaps = true;
  if (opts.separateCss == null) opts.separateCss = false;
  if (opts.sourcePath == null) opts.sourcePath = "src";
  if (opts.outputPath == null) opts.outputPath = "dist";
  if (opts.entryPoints == null) opts.entryPoints = [];
  if (opts.https == null) opts.https = false;
  if (opts.copyFiles == null) opts.copyFiles = false;
  if (opts.appAssetsRelativeUrlPath == null) opts.appAssetsRelativeUrlPath = "";
  if (opts.appBaseUrlPath == null) opts.appBaseUrlPath = "";
  return opts;
}

function getWebpackConfig(options) {
  var opts = Object.assign({}, options);
  opts = fillDefaults(opts);

  var srcAbsPath = path.resolve(opts.sourcePath);
  var src = path.relative(path.resolve("."), srcAbsPath).replace(/\\/g, "/");

  // CONFIG webpack rules
  var cssRule, lessRule;
  var rules = [{
    oneOf: [ // use only first matched
      { test: /\.jsx?$/, use: ["babel-loader"], parser: { import: false, system: false } },
      cssRule = { test: /\.css$/, use: ["style-loader", {loader: "css-loader", options: {minimize: opts.minify} }] },
      lessRule = { test: /\.less$/, use: ["style-loader", {loader: "css-loader", options: {minimize: opts.minify} }, "less-loader"] },
      { use: [{ loader: "file-loader", options: { name: "[path][name].[ext]" } }] } // if import-ing anything else just copy it
    ]
  }];
  var extractCss = (opts.separateCss ? new ExtractTextPlugin(((opts.outputFile || "").replace(/\.js$/, "") || "[name]") + ".css") : null);
  if (extractCss) {
    cssRule.use = extractCss.extract({ fallback: cssRule.use.shift(), use: cssRule.use });
    lessRule.use = extractCss.extract({ fallback: lessRule.use.shift(), use: lessRule.use });
  }

  // CONFIG webpack plugins
  var plugins = [
    // NOTE CommonsChunkPlugin does not work with externals - do not use it (https://github.com/webpack/webpack/issues/439 & https://github.com/webpack/webpack/issues/622).

    // write files to output folder even when using webpack-dev-server (because by default it builds & serves them from memory)
    new WriteFilePlugin({ log: false }),

    new webpack.DefinePlugin({
      VERSION: JSON.stringify(pkg.version),
      "process.env": {
        NODE_ENV: JSON.stringify(opts.isProductionBuild ? "production" : "development")
      }
    })
  ];

  // process HTML files via EmbeddedJS templating system (updates <base> tag depending on whether we're using Ruby server)
  var htmlTemplatePostProcessingFn = function asIs(template) { return template; };
  if (opts.copyFiles) {
    var htmlPostProcessedFiles = getHtmlFilesFromMappingsJson().filter(name => fs.existsSync(path.join(src, name)));
    htmlPostProcessedFiles.forEach(function (htmlFile) {
      plugins.push(new HtmlWebpackPlugin({
        template: "!!ejs-loader!" + src + "/" + htmlFile,
        ejsFixUrls: (htmlSnippet => htmlTemplatePostProcessingFn(htmlSnippet)),
        filename: htmlFile,
        inject: false,
        minify: {
          removeComments: true,
          minifyJS: function (text) {
            // when performing SystemJS.import("./file.js") in HTML files, the path is relative to HTML file within src/ folder,
            // but we must replace such path to be relative to our href in <base href="...">, i.e. add the subfolder chain within src/,
            // upto the file (src/abc/cde/index.html, using "./index.js" => change into "./abc/cde/index.js")
            return text.replace(/(System(?:JS)?\.import\s*\(\s*['"])([^'"]*)/g, function (m, g1, url) {
              if (url.charAt(0) === ".") url = ["."].concat(htmlFile.split(/[\\\/]/).slice(0, -1)).join("/") + "/" + url.replace(/^\.\//, "");
              return g1 + url;
            });
          }
        }
      }));
    });

    // copy unrecognized files as-is ("from" path is relative to webpack's context, i.e. srcAbsPath)
    plugins.push(new CopyWebpackPlugin([{ from: "**/*" }], { ignore: ["*.js", "*.jsx", "*.css", "*.less", "lib/**"].concat(htmlPostProcessedFiles) }));
    plugins.push(new CopyWebpackPlugin([{ from: "lib/**" }]));
    plugins.push(new CopyWebpackPlugin([{ context: "../node_modules/uu_oidcg01/dist", from: "callbacks/**" }]));
    (!opts.isProductionBuild) && plugins.push(new CopyWebpackPlugin([{ context: "../", from: "test/**" }]));
  }

  // extract CSS & minify
  if (extractCss) plugins.push(extractCss);
  if (opts.minify) {
    plugins = [
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: opts.useSourceMaps,
        // // show warnings only for JS files in srcAbsPath
        // warningsFilter: function (sourceUri) { // commented out because of warnings related to webpack import variables (related to css imports)
        //   var filePath = sourceUri.split("!").pop();
        //   return filePath.match(/\.js$/) && path.resolve(filePath).startsWith(srcAbsPath + path.sep);
        // },
        compress: {
          warnings: false
        }
      })
    ].concat(plugins);
  }

  // improve debug messages (module names) when hot module reload is used
  if (!opts.isProductionBuild) plugins.push(new webpack.NamedModulesPlugin());

  // configuration of dependencies
  var externalsConfig = opts.dependencies || {};
  externalsConfig["module"] = { baseUri: true, format: "global", exports: "undefined" }; // force external (shimmed to be undefined if loading directly via <script> tag)

  // aliases for resolving modules
  var aliases = Object.assign({}, opts.aliases, {
    "__project__": srcAbsPath, // alias for root of src folder (used by all on-the-fly created modules / chunks)
  });

  if (opts.outputFile && opts.entryPoints.length != 1) {
    throw new Error("When using \"outputFile\", exactly 1 entry point must be specified, but these were configured: " + JSON.stringify(opts.entryPoints));
  }
  if (opts.entryPoints.length == 0) {
    throw new Error("At least 1 entry point must be specified in the configuration (config/config.js).");
  }
  fs.mkdirsSync(opts.outputPath);
  var outputAbsPath = path.resolve(opts.outputPath);

  // routing support - prepare proper <base> element snippet
  if (opts.appBaseUrlPath && !opts.appBaseUrlPath.match(/^</)) { // it's not a special value
    opts.appBaseUrlPath = opts.appBaseUrlPath.replace(/\/*$/, "/"); // make sure it ends with "/"
  }
  if (opts.appAssetsRelativeUrlPath) {
    if (opts.appAssetsRelativeUrlPath.match(/^\//)) throw new Error("Configuration option appAssetsRelativeUrlPath must be relative URL path (must not start with slash).");
    opts.appAssetsRelativeUrlPath = opts.appAssetsRelativeUrlPath.replace(/\/*$/, "/").replace(/^\.\//, ""); // make sure it ends with "/" and doesn't start with "./"
  }

  opts.appBaseHtmlSnippet = "";
  if (opts.copyFiles) {
    var systemJsConfigSnippet = getSystemJSLoaderHtmlSnippet(opts);
    var preserveSegmentsMatch = (opts.appBaseUrlPath||"").match(/^<preserve-(\d+)-path-segments?>$/);
    if (preserveSegmentsMatch && (opts.appBaseUrlPath || opts.appAssetsRelativeUrlPath)) {
      // in this case, app base URL is not known during build - the HTML page containing client-side router
      // must figure out the root by checking current URL and preserve only first few
      // path segments (2 in case of uuOS9 - /vendor-app/tid-awid/...)
      htmlTemplatePostProcessingFn = (template => {
        template = template.replace(/(^|\n)(\t+)/g, "$1"); // (pretty-print) remove tabs at the beginning of lines
        template = replaceModulesInUrls(template, externalsConfig);
        var base = `<script>
        var appBaseUrlPath = (location.pathname.split(/\\//).slice(0,1+${preserveSegmentsMatch[1]}).join("/")+"/").replace(/\\/+/g,"/").replace(/"/g,"");
        var appAssetsRelativeUrlPath = ${JSON.stringify(opts.appAssetsRelativeUrlPath||"")};
        document.write('<base href="' + appBaseUrlPath + appAssetsRelativeUrlPath + '" data-uu-app-base="' + appBaseUrlPath + '" data-uu-app-assets-base="' + appAssetsRelativeUrlPath + '">');
      </script>`;
        // scripts & links with relative paths must be output using document.write, otherwise the browser (Chrome) will try
        // to load them sooner (before <base> element is written) from wrong paths
        template = template.replace(/(<script[^>]*\bsrc\s*=\s*['"])([^'"]*)(['"][^>]*>\s*<\/script>)/gi, (m, g1, url, g3) => {
          return url.match(/^\/|^[a-zA-Z0-9\\-_]*:/) ? m : `<script>document.write(${JSON.stringify(m).replace(/<\/script>/g, "<\"+\"/script>")});</script>`;
        }).replace(/(<link[^>]*\bhref=['"])([^'"]*)(['"][^>]*>)/gi, (m, g1, url, g3) => {
          return url.match(/^\/|^[a-zA-Z0-9\\-_]*:/) ? m : `<script>document.write(${JSON.stringify(m)});</script>`;
        });

        return (base + "\n\n    " + template.trim() + "\n\n    " + systemJsConfigSnippet.trim().replace(/\n/g, "\n    ")).trim();
      });
    } else {
      htmlTemplatePostProcessingFn = (template => {
        template = template.replace(/(^|\n)(\t+)/g, "$1"); // (pretty-print) remove tabs at the beginning of lines
        template = replaceModulesInUrls(template, externalsConfig);
        var base = "";
        if (opts.appBaseUrlPath || opts.appAssetsRelativeUrlPath) {
          base = `<base href="${opts.appBaseUrlPath + opts.appAssetsRelativeUrlPath}" data-uu-app-base="${opts.appBaseUrlPath}" data-uu-app-assets-base="${opts.appAssetsRelativeUrlPath}">`;
        }
        return (base + "\n\n    " + template.trim() + "\n\n    " + systemJsConfigSnippet.trim().replace(/\n/g, "\n    ")).trim();
      });
    }
  }

  // webpack development server
  var devServerConfig = {
    contentBase: outputAbsPath,
    host: opts.host,
    port: opts.port,
    https: opts.https,
    open: opts.autoOpenInBrowser,
    disableHostCheck: true, // to be able to use http://localhost.plus4u.net bound to 127.0.0.1
    setup: function (app) {
      app.set("strict routing", true); // strict routing - "/home" is different than "/home/"

      // make all requests require URL path prefix according to devServerAppBaseUrlPath, i.e. send redirect
      // if they don't have it
      var devServerAppBaseUrlPath = (opts.devServerAppBaseUrlPath || "").replace(/\/+$/, "");
      if (devServerAppBaseUrlPath) {
        app.use((req, res, next) => {
          if (req.method === "GET" && !req.path.startsWith(devServerAppBaseUrlPath + "/")) {
            return res.redirect(req.path === devServerAppBaseUrlPath ? devServerAppBaseUrlPath + "/" : devServerAppBaseUrlPath + req.path);
          }
          next();
        });
        app.use((req, res, next) => { // the request got past 1st middleware - remove the prefix so that webpack can return the file properly
          req.url = req.url.replace(devServerAppBaseUrlPath + "/", "/");
          next("route");
        });
      }

      // rewrite 'non-existent path && accept/html' to index.html (or other files as specified in server or client config/mappings.json)
      // NOTE This middleware must be before the one that removes appAssetsRelativeUrlPath from the path.
      var mappingsJson = getMappingsJson();
      if (Object.keys(mappingsJson || {}).length > 0) {
        var ucMap = {};
        for (var k in mappingsJson) Object.assign(ucMap, (mappingsJson[k] || {})["useCaseMap"]);
        // create list of VUC mappings with matcher function ("matchFn") and the rule relevancy, such as:
        //   home/xy
        //   home/
        //   home
        //   home/{asdf}/{qwer}
        //   home/{asdf}
        var ucList = Object.keys(ucMap).filter(k => ucMap[k].type === "VUC").map(k => {
          if (k === "defaultVuc") return { key: k, matchFn: url => true, relevancy: 0, value: ucMap[k] };
          var relX = 1;
          var regexpStr = "^(" + k.replace(/[^\{]+|\{[^}]*\}/g, m => {
            if (m.charAt(0) === "{") relX *= 0.9;
            return m.charAt(0) === "{" ? "[^/]*(/[^/]*)*?" : regexpEscape(m);
          }) + ")$";
          var relevancy = (relX == 1 ? 1 : 1 - relX);
          var regexp = new RegExp(regexpStr);
          return {
            key: k,
            matchFn: k.indexOf("{") === -1 ? ((url) => k === url) : function (url) {
              return !!url.match(regexp);
            },
            relevancy: relevancy,
            value: ucMap[k]
          };
        });
        ucList.sort((a, b) => b.relevancy - a.relevancy || b.key.length - a.key.length);
        
        app.use((req, res, next) => {
          if (req.method == "GET" && (!opts.appAssetsRelativeUrlPath || !req.url.startsWith("/" + opts.appAssetsRelativeUrlPath))) {
            // if requesting application/json from a URL which is listed in mappings.json, return 204 No Content
            var expectsHtml = (req.accepts(["application/json", "text/html"]) == "text/html"); // there might be multiple acceptable content types
            var expectsApplicationJsonOnly = (req.get("Accept") == "application/json");
            var urlPath = req.path.replace(/^\/*/, "");

            // if the file exists, just return it as-is
            var filePath = path.resolve(outputAbsPath, urlPath);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return res.sendFile(urlPath, { root: outputAbsPath});

            var targetUc = ucList.filter(uc => uc.matchFn(urlPath))[0];
            if (targetUc) {
              if (expectsApplicationJsonOnly) return res.status(200).send("{}");
              
              // if requesting text/html from a URL which is listed in mappings.json, return corresponding HTML file (or defaultVuc)
              filePath = expectsHtml ? path.resolve(outputAbsPath, targetUc.value.realization || "") : null;
              // console.log(urlPath, filePath, targetUc);
              if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return res.sendFile(targetUc.value.realization, { root: outputAbsPath});
            }
          }
          next();
        });
      }

      if (opts.appAssetsRelativeUrlPath) {
        // rewrite routes starting with opts.appAssetsRelativeUrlPath to omit it
        app.use((req, res, next) => {
          req.url = req.url.replace("/" + opts.appAssetsRelativeUrlPath, "/");
          next("route");
        });
      }
    }
  };

  // prepare webpack configuration
  var webpackConfig = [];

  // convert entry files from entryPoints to webpack configuration (we'll need to generate different entry file
  // for each of these as a workaround because we need to set publicPath during runtime, not during compile time
  // which is not as straightforward with webpack - https://github.com/webpack/webpack/issues/2776)
  var chunksAsModules = opts.entryPoints.map(it => "./" + path.relative(srcAbsPath, path.resolve(srcAbsPath, it)).replace(/\\/g, "/"));
  var chunkNames = chunksAsModules.map(it => it.substr(2).replace(/\.js$/, ""));
  var chunkNamesMap = chunkNames.reduce((r, it, i) => { r[it] = createEntryPointFile(chunksAsModules[i], opts); return r; }, {}); // e.g. "index" => "./.tmp/index.js"
  webpackConfig.push({
    context: srcAbsPath,
    entry: chunkNamesMap,
    output: {
      filename: opts.outputFile || "[name].js",
      chunkFilename: "chunks/[name]-[hash].js",
      path: outputAbsPath,
      // publicPath: undefined, // publicPath is configured during runtime (in browser)
      pathinfo: !opts.minify,
      jsonpFunction: "__webpack_jsonp_" + pkg.name.replace(/[^a-zA-Z0-9]/g, "_"), // to prevent collisions between libraries if they load chunks themselves
      libraryTarget: "umd",
      library: (opts.libraryGlobalVariable ? opts.libraryGlobalVariable.split(/\./) : "[name]"),
      umdNamedDefine: true,
      devtoolModuleFilenameTemplate: (opts.useSourceMaps ? "webpack:///" + pkg.name + "@" + pkg.version + "/" + src.replace(/\\/g, "/") + "/[resource-path]" : undefined)
    },
    resolve: {
      alias: aliases
    },
    module: {
      rules: rules
    },
    plugins: plugins,
    externals: function (context, request, callback) {
      var rootModule = request.replace(/\/.*/, ""); // "module/that/is/nested" => "module"
      var conf = externalsConfig[request] || externalsConfig[rootModule];
      if (!conf || conf.baseUri === false) return callback(); // configured as not external
      var loadAs = {
        amd: request,
        commonjs: request,
        commonjs2: request,
        root: typeof conf == "string" ? conf : (conf.format == "global" ? conf.exports : request)
      };
      return callback(null, loadAs);
    },
    devtool: (opts.useSourceMaps ? "source-map" : false),
    devServer: devServerConfig
  });

  // add generation of uu5-environment.js file
  if (opts.copyFiles) {
    var uu5EnvFileContents = !opts.isProductionBuild ? `
var devConfig = require("../config/uu5-environment-dev.json");
var config = require("./${path.relative(__dirname, path.resolve(srcAbsPath, "uu5-environment.json")).replace(/\\/g, "/")}");
if (devConfig) for (var k in devConfig) config[k] = devConfig[k];
window.UU5 = { Environment: config };
` : `window.UU5={Environment:require("./${path.relative(__dirname, path.resolve(srcAbsPath, "uu5-environment.json")).replace(/\\/g, "/")}")};`;
    webpackConfig.push({
      context: srcAbsPath,
      entry: {"uu5-environment": createTemporaryModuleFile(uu5EnvFileContents, "uu5-environment.js")},
      output: {
        filename: "[name].js",
        path: outputAbsPath
      },
      plugins: 
        (opts.minify ? [
          new webpack.optimize.UglifyJsPlugin({
            sourceMap: opts.useSourceMaps,
            compress: {
              warnings: false
            }
          })] : []
        ).concat([
          new WriteFilePlugin({ log: false })
        ])
    });
  }

  return webpackConfig;


  function createEntryPointFile(name, opts) {
    fs.mkdirsSync(".tmp/" + name.replace(/^(.*\/).*/, "$1").replace(/^\.\//, ""));
    var noRelativeName = name.replace(/^\.\//, "");
    var noRelativeOutputName = (opts.outputFile ? opts.outputFile.replace(/^\.\//, "").replace(/\\/g, "/") : noRelativeName);
    var depthFromAppAssetsBase = noRelativeOutputName.split(/\//).length;
    var entryFileContents =
  `var mod=require("module");
  var uri = ((mod ? mod.uri : (document.currentScript || Array.prototype.slice.call(document.getElementsByTagName("script"), -1)[0] || {}).src) || "").toString();
  __webpack_public_path__=uri.split(/\\//).slice(0, -${depthFromAppAssetsBase}).join("/") + "/"; // runtime publicPath configuration required for proper linking of styles, background images, ...
  module.exports = require("__project__/${noRelativeName}");`;

    return createTemporaryModuleFile(entryFileContents, noRelativeName);
  }
}

function regexpEscape(aValue) {
  if (!aValue) return "";
  return aValue.replace(/([\[\]\\+*?{}()^$.|])/g, "\\$1");
}

function getSystemJSLoaderHtmlSnippet(opts) {
  var systemJsSettings = getLoaderSettings(opts);

  // clean-up (remove empty keys / values)
  for (var k in systemJsSettings) {
    var v = systemJsSettings[k];
    if (v == null || (typeof v == "object" && Object.keys(v).length == 0)) delete systemJsSettings[k];
  }

  var loaderSnippet =
`<script>
  SystemJS.config(${JSON.stringify(systemJsSettings, null, "  ").replace(/\n/g, "\n  ")});
</script>`;
  return loaderSnippet;
}

/**
 * @param {*} opts Build options.
 * @return SystemJS loader settings.
 */
function getLoaderSettings(opts) {
  var settings = {
    map: {},
    paths: {},
    meta: {},
    packages: {}
  };

  // create mappings, such as "react" => ".../react/15.4.2/react.min.js"
  var deps = Object.keys(opts.dependencies);
  deps.forEach(depName => {
    var dep = opts.dependencies[depName];
    if (typeof dep.baseUri !== "string") return; // skip special modules ("module", ...)

    var baseUri = dep.baseUri || "";
    baseUri = baseUri.replace(/\/*$/, "/"); // always end with slash
    settings.paths[depName] = baseUri + dep.main;
    // settings.paths[depName + "/*"] = baseUri + "*";

    var config = Object.assign({}, dep);
    delete config.baseUri;
    delete config.main;
    if (Object.keys(config).length > 0) settings.meta[depName] = config;
  });

  return settings;
}

/**
 * Returns packages in project. Package is a folder directly in src/, which contain
 * an entry point of the same name as the package. E.g. package "abc" must be in
 * src/abc/abc.js.
 *
 * @param src The folder with source files.
 * @return List of project packakges.
 */
function getProjectPackageList(src) {
  var packages = fs.readdirSync(src);
  packages = packages.map(dir => dir.replace(/\\/g, "/")).map(dir => {
    var name = dir; // currently only 1 level is supported (folders directly in src/)
    return {
      directory: dir, // relative path (without "./" prefix)
      name: name,
      moduleName: "app/" + name,
      entryPoint: dir + "/" + name + ".js"
    };
  });
  var existingPackages = packages.filter(pack => fs.existsSync(path.join(src, pack.entryPoint)));
  return existingPackages;
}

/**
 * @param {*} moduleName The module name whose package.json to return.
 * @param {*} defaultValue The default value to return in case that given module doesn't exist.
 *   If defaultValue is not given, an exception will be thrown in this case.
 * @return Returns package.json (as a JSON object) of NPM module with given name.
 */
function getPackageJson(moduleName, defaultValue) {
  var depPkgJsonPath = "node_modules/" + moduleName + "/package.json";
  if (!fs.existsSync(depPkgJsonPath)) {
    if (defaultValue) return defaultValue;
    throw new Error("Package.json for node module '" + moduleName + "' has not been found at " + depPkgJsonPath + ". Try 'npm install' or 'npm update', or remove the dependency mapping configuration from tools/config.js.");
  }
  var depPkg = require("../" + depPkgJsonPath);
  return depPkg;
}

/**
 * Replaces module URLs in the form of "~module/some/file" by URLs as configured in "dependencies"
 * variable, e.g. to "http://example.com/libs/module/1.0.0/some/file" where "http://example.com/libs/module/1.0.0/"
 * is base URI of the module "module".
 *
 * @param {*} htmlString HTML with <link> and <script> elements with URLs that are to be replaced.
 * @param {*} dependencies Dependency configuration (see config/config.js).
 * @return HTML with replaced URLs.
 */
function replaceModulesInUrls(htmlString, dependencies) {
  return htmlString.replace(/(\b(?:src|href)=['"])([^'"]+)/gi, function (m, g1, g2) {
    if (g2.charAt(0) != "~") return m;
    return g1 + g2.replace(/^~([^\/]+)\//, (m, module) => {
      var depConf = dependencies[module];
      if (!depConf || !depConf.baseUri) throw new Error(`Module '${module}' is referenced from a HTML file (via ${m}) but module's base URI is not configured in config/config.js.` +
          `Add configuration for the module by either specifying cdnBaseUri (if using CDN) or localBaseUri (if the module should be copied locally to the app public folder), or remove the reference from HTML file.`);
      return depConf.baseUri;
    });
  });
}

var tempCounter = 0;
function createTemporaryModuleFile(fileContents, optionalFileName) {
  fs.ensureDirSync(".tmp");
  var tmpFilePath = ".tmp/" + (optionalFileName ? optionalFileName : "temp-" + (tempCounter++) + ".js");
  fs.removeSync(tmpFilePath);
  fs.writeFileSync(tmpFilePath, fileContents, "utf-8");

  // prevent re-compilation loop during first few seconds after "npm start"
  // https://github.com/webpack/watchpack/issues/25
  var timeInPast = Date.now() / 1000 - 10;
  fs.utimesSync(tmpFilePath, timeInPast, timeInPast);
  return path.resolve(tmpFilePath);
}

function getServerDirName() {
  return path.basename(process.cwd()).replace(/-client/, "-server"); // "xyz-client" => "xyz-server"
}

var DEFAULT_MAPPINGS_JSON = {
  "{vendor}-{uuApp}-{uuSubApp}": {
    "useCaseMap": {
      "defaultVuc": {
        "realization": "index.html",
        "httpMethod": "GET",
        "type": "VUC"
      }
    }
  }
};
function getMappingsJson() {
  var filePath = `../${getServerDirName()}/config/mappings.json`;
  if (!fs.existsSync(filePath)) filePath = "config/mappings.json";
  if (!fs.existsSync(filePath)) return DEFAULT_MAPPINGS_JSON;
  var mappingsJson = fs.readFileSync(filePath, "utf-8");
  return mappingsJson ? JSON.parse(mappingsJson) : {};
}
function getHtmlFilesFromMappingsJson() {
  var mappingsJson = getMappingsJson();
  var resultMap = {};
  for (var k in mappingsJson) {
    // iterate over UCs in the mappings.json and pick those which are VUC and end with .html (or .htm)
    var ucMap = (mappingsJson[k] || {})["useCaseMap"] || {};
    Object.keys(ucMap)
      .filter(uc => ucMap[uc].type === "VUC" && (ucMap[uc].realization||"").match(/\.html?$/i))
      .map(uc => ucMap[uc].realization.replace(/^\/+/, ""))
      .forEach(htmlFile => resultMap[htmlFile] = true); // add to a map so that duplicities are handled properly
  }
  return Object.keys(resultMap);
}

var nsApp = require("../../app.json")["namespace"];
var nsCss = nsApp.replace(/\w+/g, m => m.toLowerCase()).replace(/\W+/g, "-"); // "UU.DemoApp" => "uu-demoapp" (lowercased with non-word characters changed to single "-")
function createNamespaceAliasFileForJs() {
  var nsConfig = `export default {
    namespace: '${nsApp}',
    cssPrefix: '${nsCss}',
    tag: function(component) {return this.namespace + '.' + component;},
    css: function(component) {return this.cssPrefix + '-' + component;},
  };`;
  return createTemporaryModuleFile(nsConfig);
}
function createNamespaceAliasFileForCss() {
  var nsLess = `@cssNs: ${nsCss};`;
  return createTemporaryModuleFile(nsLess, "cssns.less");
}

module.exports = {
  getWebpackConfig,
  getProjectPackageList,
  getPackageJson,
  getServerDirName,
  getHtmlFilesFromMappingsJson,
  createNamespaceAliasFileForJs,
  createNamespaceAliasFileForCss
};
