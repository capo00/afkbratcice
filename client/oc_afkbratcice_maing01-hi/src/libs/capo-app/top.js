//@@viewOn:imports
import { createVisualComponent, Utils, useStickyTop, useRoute } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { useGoogleSession } from "../capo-google-auth";

//@@viewOff:imports

function updateHref({ href, itemList, ...item }, setRoute) {
  if (itemList) item.itemList = itemList.map((it) => updateHref(it, setRoute));
  if (href) {
    const key = itemList ? "onLabelClick" : "onClick";
    item[key] = () => setRoute(href);
  }
  return item;
}

function getLoginButton(session) {
  let onClick,
    itemList,
    children,
    icon = "uugds-account";
  if (session.state === "notAuthenticated") onClick = () => session.login();
  else if (session.state === "authenticated") {
    icon = null;
    children = (
      <img
        alt="User photo"
        src={session.identity.photo}
        height="90%"
        className={Config.Css.css({ marginLeft: -8, marginRight: -4, borderRadius: "50%" })}
        title="Přihlášený uživatel"
      />
    );
    itemList = [{ icon: "uugds-log-out", children: "Odhlásit", onClick: () => session.logout() }];
  }

  return { icon, onClick, itemList, children };
}

const Top = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Top",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    const { logoUri, logoHref, logoTooltip, menuList, ...restProps } = props;

    const [, setRoute] = useRoute();

    const { ref, style, visibilityMatches, metrics } = useStickyTop("onScrollUp", true);

    const spacing = Uu5Elements.useSpacing();

    const logoHeight = 160;
    const buttonXlHeight = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", "xl"]).h;

    const logoStyles = {
      position: "absolute",
      top: 0,
      height: logoHeight,
      cursor: logoHref ? "pointer" : undefined,
      transition: "height 300ms ease, left 300ms ease",
    };

    const coverStyles = {
      position: "relative",
      margin: "0 auto",
      paddingLeft: logoStyles.height - 24,
      transition: "padding 300ms ease",
    };

    if (metrics?.offsetToStickyBoundary < 0) {
      logoStyles.height = buttonXlHeight;
      logoStyles.left = (logoHeight - logoStyles.height) / 2;

      if (visibilityMatches) {
        // small
        logoStyles.height = buttonXlHeight + 16;
        logoStyles.left = (logoHeight - logoStyles.height) / 2;
      } else {
        // hidden
      }
    } else {
      // big
      coverStyles.paddingTop = buttonXlHeight;
      logoStyles.left = 0;
    }

    // adding loginButton, because ButtonGroup does not support { component: LoginButton }
    const session = useGoogleSession();
    const updatedMenuList = [...menuList, getLoginButton(session)];

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      restProps,
      Config.Css.css({
        ...style,
        background: "linear-gradient(180deg, rgba(15,15,15,1) 50%, transparent 100%)",
        paddingInline: spacing.d,
      }),
    );

    return (
      <div {...attrs} ref={ref}>
        <div className={Config.Css.css(coverStyles)}>
          <img
            alt={logoTooltip}
            src={logoUri}
            className={Config.Css.css(logoStyles)}
            onClick={() => setRoute(logoHref)}
            title={logoTooltip}
          />
          <Uu5Elements.ButtonGroup
            itemList={updatedMenuList.map((item) => updateHref(item, setRoute))}
            borderRadius="none"
            size="xl"
            significance="subdued"
          />
        </div>
      </div>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Top };
export default Top;
//@@viewOff:exports
