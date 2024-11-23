//@@viewOn:imports
import { createVisualComponent, Utils, useStickyTop, useRoute, useLsi, useState, useScreenSize, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import OcAuth from "../oc_cli-auth";
import Config from "./config/config.js";
import anonymousUri from "./assets/anonymous.png";
//@@viewOff:imports

function updateHref({ href, params, itemList, ...item }, setRoute) {
  if (itemList) item.itemList = itemList.map((it) => updateHref(it, setRoute));
  if (href) {
    const key = itemList ? "onLabelClick" : "onClick";
    item[key] = () => setRoute(href, params);
  }
  return item;
}

function Photo({ screenSize }) {
  const session = OcAuth.useSession();
  const title = useLsi({ cs: "Přihlášený uživatel" });
  const isSmall = screenSize === "xs";

  const [uri, setUri] = useState(session.identity.photo);

  return (
    <img
      alt="User"
      src={uri}
      height="90%"
      className={Config.Css.css({
        marginInlineStart: isSmall ? -24 : -8,
        marginInlineEnd: isSmall ? -24 : -4,
        borderRadius: "50%",
      })}
      title={title}
      onError={() => setUri(anonymousUri)}
      referrerPolicy="no-referrer"
    />
  );
}

function getLoginButton(session, screenSize, item) {
  let onClick,
    itemList,
    children,
    icon = "uugds-account";

  if (session.state === "notAuthenticated") onClick = () => session.login();
  else if (session.state === "authenticated") {
    icon = null;
    children = <Photo screenSize={screenSize} />;
    itemList = item?.itemList
      ? item.itemList
          .map(({ profile, ...it }) => (session.identity?.profileList?.includes(profile) ? it : null))
          .filter(Boolean)
      : [];
    itemList.push({
      icon: "uugds-log-out",
      children: <Lsi lsi={{ cs: "Odhlásit" }} />,
      onClick: () => session.logout(),
    });
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
    let { children } = restProps;

    const [, setRoute] = useRoute();
    const [screenSize] = useScreenSize();

    const { ref, style, visibilityMatches, metrics } = useStickyTop("onScrollUp", true);

    const spacing = Uu5Elements.useSpacing();

    const logoHeight = screenSize === "xs" ? 80 : 136;
    let buttonXlHeight = Uu5Elements.UuGds.SizingPalette.getValue(["spot", "basic", "xl"]).h;
    if (screenSize === "xs") buttonXlHeight /= 2;

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
      paddingLeft: logoStyles.height - (screenSize === "xs" ? 16 : 24),
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
    const session = OcAuth.useSession();

    const identityItemIndex = menuList.findIndex((item) => item.key === "identity");
    const updatedMenuList = [...menuList];

    if (identityItemIndex > -1) {
      updatedMenuList[identityItemIndex] = getLoginButton(session, screenSize, menuList[identityItemIndex]);
    } else {
      updatedMenuList.push(getLoginButton(session, screenSize));
    }

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(
      restProps,
      Config.Css.css({
        ...style,
        background: "#0f0f0f",
        paddingInline: spacing.d,
        ...(screenSize === "xs"
          ? {
              // because of Drawer (Menu) does not have a className and must be for whole height
              // in case small content the menu is small
              "& + div": {
                minHeight: "calc(100vh - 72px)",
              },
            }
          : null),
      }),
    );

    const [menu, setMenu] = useState(null);

    let itemList = updatedMenuList.map((item) =>
      updateHref(item, (...args) => {
        setRoute(...args);
        setMenu(null);
      }),
    );
    if (screenSize === "xs") {
      const identityItem = itemList.splice(identityItemIndex > -1 ? identityItemIndex : itemList.length - 1, 1)[0];
      const hiddenMenu = itemList;
      const hiddenIdentity = identityItem.itemList;
      delete identityItem.itemList;

      itemList = [
        { icon: "uugds-menu", onClick: () => setMenu(menu ? null : hiddenMenu) },
        { ...identityItem, onClick: identityItem.onClick ?? (() => setMenu(menu ? null : hiddenIdentity)) },
      ];

      children = (
        <Uu5Elements.Drawer
          open={!!menu}
          onClose={() => setMenu(null)}
          content={menu ? <Uu5Elements.MenuList itemBorderRadius="moderate" itemList={menu} /> : null}
          position="right"
        >
          {children}
        </Uu5Elements.Drawer>
      );
    }

    return (
      <>
        <div {...attrs} ref={ref}>
          <div className={Config.Css.css(coverStyles)}>
            <img
              alt={logoTooltip}
              src={logoUri}
              className={Config.Css.css(logoStyles)}
              onClick={() => setRoute(logoHref)}
              title={logoTooltip}
            />
            <Uu5Elements.ActionGroup itemList={itemList} size="xl" />
          </div>
        </div>
        {children}
      </>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Top };
export default Top;
//@@viewOff:exports
