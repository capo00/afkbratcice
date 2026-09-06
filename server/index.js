import { App } from "caio-server";
import api from "./api.js";
import legacyRedirect from "./legacy-redirect.js";

// publicPath se resolvuje z process.cwd() -- nepředávat.
// legacyRedirect musí běžet PŘED SPA fallbackem, jinak by cesty bez přípony spolkl
// index.html; proto jde do middlewareList, ne na vrácenou app.
App.init({ api, middlewareList: [legacyRedirect] });
