import { Authentication, BinaryStore } from "caio-server";

import Config from "./config.js";
import clubApi from "./club/api.js";
import categoryApi from "./category/api.js";
import teamApi from "./team/api.js";
import seasonApi from "./season/api.js";
import matchApi from "./match/api.js";
import statsApi from "./stats/api.js";
import personApi from "./person/api.js";
import playerApi from "./player/api.js";
import managementApi from "./management/api.js";
import articleApi from "./article/api.js";
import galleryApi from "./gallery/api.js";
import fileApi from "./file/api.js";
// BACKWARD-COMPAT: `appConfig/get` pro starý bundle klienta, jedno vydání (app-config/api.js).
import appConfigApi from "./app-config/api.js";
import seoApi from "./seo/api.js";

// Binárky se dělí do kolekcí a autorizace se nastavuje per kolekce -- fotograf, který
// nahrává do galerie, nemá mít možnost přepsat logo klubu (design/roles.md, 5.1).
// Čtení je všude veřejné: co se sem nahraje, se stejně veřejně zobrazuje.
const binaryCollectionMap = {
  [Config.BINARY_COLLECTION.SYS]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.CLUB]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.TEAM]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.PERSON]: { write: { profileList: Config.CONTENT } },
  [Config.BINARY_COLLECTION.ARTICLE]: { write: { profileList: Config.NEWS } },
  [Config.BINARY_COLLECTION.GALLERY]: { write: { profileList: Config.GALLERY } },
  [Config.BINARY_COLLECTION.PAGE]: { write: { profileList: Config.PAGES } },
  // `read` se schválně nevyplňuje = veřejné čtení, stejně jako u ostatních kolekcí.
  [Config.BINARY_COLLECTION.DOWNLOAD]: { write: { profileList: Config.PAGES } },
};

export default {
  ...clubApi,
  ...categoryApi,
  ...teamApi,
  ...seasonApi,
  ...matchApi,
  ...statsApi,
  ...personApi,
  ...playerApi,
  ...managementApi,
  ...articleApi,
  ...galleryApi,
  ...fileApi,
  ...appConfigApi,
  ...seoApi,
  ...Authentication.createApi(),
  ...(BinaryStore.isConfigured() ? BinaryStore.createApi({ collectionMap: binaryCollectionMap }) : {}),
};
