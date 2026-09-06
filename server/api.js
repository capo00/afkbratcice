import { readFileSync } from "fs";
import { Authentication, BinaryStore } from "caio-server";

import Config from "./config.js";
import teamApi from "./team/api.js";
import seasonApi from "./season/api.js";
import matchApi from "./match/api.js";
import statsApi from "./stats/api.js";
import personApi from "./person/api.js";
import playerApi from "./player/api.js";
import coachApi from "./coach/api.js";
import galleryApi from "./gallery/api.js";
import fileApi from "./file/api.js";
import appConfigApi from "./app-config/api.js";
import seoApi from "./seo/api.js";

// Verzi čteme z package.json, ne z process.env.npm_package_version -- ta proměnná
// existuje jen při startu přes npm skript, takže `node server/index.js` by hlásil
// undefined.
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const sysApi = {
  "sys/health": {
    method: "get",
    fn: async () => ({
      version,
      env: process.env.NODE_ENV || "development",
      uptime: Math.round(process.uptime()),
      // Konfigurace se hlásí, ne testuje -- health musí odpovědět i když je Mongo dole,
      // aby šlo odlišit "server neběží" od "server běží, databáze ne".
      mongoConfigured: !!process.env.MONGODB_URI,
      googleAuthConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      facebookAuthConfigured: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      mailConfigured: !!(process.env.SMTP_HOST && process.env.MAIL_FROM && process.env.APP_URL),
      gcsConfigured: BinaryStore.isConfigured(),
    }),
  },
};

// Binárky se dělí do kolekcí a autorizace se nastavuje per kolekce -- fotograf, který
// nahrává do galerie, nemá mít možnost přepsat logo klubu (design/roles.md, 5.1).
// Čtení je všude veřejné: co se sem nahraje, se stejně veřejně zobrazuje.
const binaryCollectionMap = {
  [Config.BINARY_COLLECTION.SYS]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.TEAM]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.PERSON]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.ARTICLE]: { write: { profileList: Config.NEWS } },
  [Config.BINARY_COLLECTION.GALLERY]: { write: { profileList: Config.GALLERY } },
  [Config.BINARY_COLLECTION.PAGE]: { write: { profileList: Config.PAGES } },
  // `read` se schválně nevyplňuje = veřejné čtení, stejně jako u ostatních kolekcí.
  [Config.BINARY_COLLECTION.DOWNLOAD]: { write: { profileList: Config.PAGES } },
};

export default {
  ...sysApi,
  ...teamApi,
  ...seasonApi,
  ...matchApi,
  ...statsApi,
  ...personApi,
  ...playerApi,
  ...coachApi,
  ...galleryApi,
  ...fileApi,
  ...appConfigApi,
  ...seoApi,
  ...Authentication.createApi(),
  ...(BinaryStore.isConfigured() ? BinaryStore.createApi({ collectionMap: binaryCollectionMap }) : {}),
};
