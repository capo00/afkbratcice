const path = require("path");
const productApi = require("./product/api");
const customerApi = require("./customer/api");
const orderApi = require("./order/api");

module.exports = {
  "caio-lenavisage": {
    method: "get",
    fn: async ({ res, publicPath }) => {
      res.sendFile(path.resolve(publicPath, "caio-lenavisage.html"));
      return false;
    },
  },
  ...productApi,
  ...customerApi,
  ...orderApi
};
