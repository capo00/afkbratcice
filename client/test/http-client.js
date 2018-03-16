const HttpClient = {
  get: function (url, successFn, failureFn) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState == 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            successFn(json);
          } catch (err) {
            failureFn(err);
          }
        } else {
          failureFn(new Error("Server responded with status " + xhr.status));
        }
      }
    };
    xhr.send(null);
  }
};

export default HttpClient;