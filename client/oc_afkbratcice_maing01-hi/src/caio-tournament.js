import { AppContainer } from "react-hot-loader";
import { Environment, Utils } from "uu5g05";

import Spa from "./caio-tournament/spa.js";

Environment["appVersion"] = process.env.VERSION;

if (!navigator.userAgent.match(/iPhone|iPad|iPod/)) {
  let link = document.createElement("link");
  link.rel = "manifest";
  link.href = "assets/manifest.json";
  document.head.appendChild(link);
}

let _targetElementId;

function render(targetElementId) {
  _targetElementId = targetElementId;

  Utils.Dom.render(
    <AppContainer>
      <Spa />
    </AppContainer>,
    document.getElementById(targetElementId),
  );
}

if (module.hot) {
  module.hot.accept("./caio-tournament/spa", () => {
    if (_targetElementId) render(_targetElementId);
  });
}

export { render };
