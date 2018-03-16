import Calls from "../src/calls.js"
import HttpClient from "./http-client.js";

const appAssetsBaseUri = (document.baseURI || (document.querySelector("base")||{}).href || (location.protocol + "//" + location.host + location.pathname)).replace(/^(.*)\/.*$/, "$1/"); // strip what's after last slash

/**
 * Mocks
 */
Calls.call = function(method, url, dtoIn){
  let mockUrl = appAssetsBaseUri + "test/data/" + url + ".json";
  HttpClient.get(mockUrl, response => {
    dtoIn.done(response);
  }, error => {
    dtoIn.fail(error);
  });
};

Calls.getCommandUri = function(aUseCase) {
  return aUseCase;
};

Calls.authorizeVuc = function(dtoIn){
  let mockUrl = appAssetsBaseUri + "test/authorization/" + dtoIn.data.name + ".json";
  HttpClient.get(mockUrl, response => {
    dtoIn.done(response);
  }, error => {
    dtoIn.fail(error);
  });
};

export default Calls;
