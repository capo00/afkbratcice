import { App } from "caio-server";
import api from "./api.js";
import serverConfig from "./server.config.js";
import legacyRedirect from "./legacy-redirect.js";
import { sitemap } from "./seo/api.js";
import { validatePublic, validatePrivate } from "./app-settings/index.js";

// publicPath se resolvuje z process.cwd() -- nepředávat.
// legacyRedirect musí běžet PŘED SPA fallbackem, jinak by cesty bez přípony spolkl
// index.html; proto jde do middlewareList, ne na vrácenou app.
// robots.txt a sitemap.xml generuje caio-server; obsah sitemapy je náš (seo/api.js).
// `config` je server.config.js (caio-server ho validuje, neznámý klíč start shodí); `settings`
// jsou validátory nastavení klubu, které správce ukládá přes `sys/settings/update` (app-settings/).
App.init({
  api,
  config: serverConfig,
  middlewareList: [legacyRedirect],
  seo: { sitemap },
  settings: { validatePublic, validatePrivate },
});
