import React from "react";
import ReactDOM from "react-dom";

import App from "./core/app.js";

import "./index.less";

export function render(targetElementId) {
  ReactDOM.render(
    <App>

    </App>,
    document.getElementById(targetElementId)
  );
}
