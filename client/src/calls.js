/**
 * Server calls of application client.
 */

import * as UU5 from 'uu5g04';

let Calls = {

  call(method, useCase, dtoIn, headers) {
    let request = new XMLHttpRequest();

    let url = 'http://afkbratcice.cz/api/' + useCase;

    let params;

    if (dtoIn.data && Object.keys(dtoIn.data).length) {
      if (method === 'get') {
        url += UU5.Common.Tools.encodeQuery({ data: dtoIn.data });
      } else {
        params = JSON.stringify(dtoIn.data);
      }
    }

    request.open(method.toUpperCase(), url, true);

    headers = headers || {};
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    for (let k in headers) {
      request.setRequestHeader(k, headers[k]);
    }

    request.onreadystatechange = () => {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          let response = {};
          if (request.response) {
            try {
              response = JSON.parse(request.response);
            } catch (e) {
              dtoIn.fail(request.response);
              return;
            }
          }
          dtoIn.done(response);
        } else {
          dtoIn.fail(request.response);
        }
      }
    };

    request.send(params);
  },

  getArticles(dtoIn) {
    Calls.call('get', 'getArticles', dtoIn);
  },

  getTable(dtoIn) {
    Calls.call('get', 'getTable', dtoIn);
  },

  getClosestMatches(dtoIn) {
    Calls.call('get', 'getClosestMatches', dtoIn);
  },

  getNews(dtoIn) {
    Calls.call('get', 'getNews', dtoIn);
  },
};

export default Calls;
