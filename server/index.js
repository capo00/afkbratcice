const path = require("path");
const AppServer = require("./libs/oc_app-server");
// const OcBinaryStorage = require("./libs/oc_binarystore");
const afkApi = require("./api");
const theChaseApi = require("./the-chase/api");

const API = {
  ...theChaseApi,
  ...afkApi,
};

const app = AppServer.App.init({
  // publicPath: path.resolve(__dirname, "../public"),
  publicPath: path.resolve(__dirname, "../client/oc_afkbratcice_maing01-hi/public"),
  api: API,
});

// OcBinaryStorage.init(app, { googleDiskAuthPath: path.resolve(__dirname, "./system-identity.json") });

// if (process.env.NODE_ENV !== "production") {
//   const allowedOrigins = ["http://localhost:1234", "http://192.168.88.91:1234", "http://192.168.88.12:1234"]
//   app.use(cors({
//     origin(origin, callback) {
//       // allow requests with no origin
//       // (like mobile apps or curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg = "The CORS policy for this site does not " +
//           "allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     }
//   }));
// }
