//@@viewOn:imports
import { createComponent, ErrorBoundary, PropTypes, useRoute, useRouter, useSession, Suspense } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
//@@viewOff:imports

const STATICS = {
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Router",
  //@@viewOff:statics
};

const Router = createComponent({
  ...STATICS,

  //@@viewOn:propTypes
  propTypes: {
    routeMap: PropTypes.objectOf(
      PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({
          component: PropTypes.func,
          skipHistory: PropTypes.bool,
          rewrite: PropTypes.string,
          redirect: PropTypes.string,
        }),
      ])
    ),
    errorFallback: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    routeMap: undefined,
    errorFallback: (props) => <h1>Error</h1>,
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    let { routeMap, errorFallback } = props;
    let content = useRouter(routeMap);
    let session = useSession();

    let [route] = useRoute();
    let resetKey = route ? JSON.stringify([route.uu5Route, sortKeys(route.params), session?.state]) : "";
    //@@viewOff:private

    //@@viewOn:interface
    //@@viewOff:interface

    //@@viewOn:render
    // Suspense for lazy-loaded content components
    content = <Suspense fallback={<Uu5Elements.Pending size="max" />}>{content}</Suspense>;

    return errorFallback ? (
      <ErrorBoundary fallback={errorFallback} resetKey={resetKey}>
        {content}
      </ErrorBoundary>
    ) : (
      content
    );
    //@@viewOff:render
  },
});

//@@viewOn:helpers
function sortKeys(obj) {
  if (!obj || typeof obj !== "object") return obj;
  let result = {};
  for (let k of Object.keys(obj).sort()) result[k] = obj[k];
  return result;
}

//@@viewOff:helpers

export { Router };
export default Router;
