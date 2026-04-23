import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { SpaProvider, Spa as SpaView } from "../libs/oc_cli-app";
import { useSession } from "../libs/oc_cli-auth";
import Page from "../libs/oc_cli-app/page";
import Router from "../core/router.js";
import Wizard from "./home/wizard.js";
import Archive from "./archive/archive.js";
import ProductList from "./product/product-list.js";
import CustomerList from "./customer/customer-list.js";
import logoUri from "../assets/lena_visage-icon-white.svg";

Uu5Elements.UuGds.setMeaningColor("primary", "pink");

const ROUTE_MAP = {
  "caio-lenavisage": (props) => <Wizard {...props} />,
  "caio-lenavisage/": (props) => <Wizard {...props} />, // TODO remove after uu5g05 >= 1.47.3
  "caio-lenavisage/order": (props) => <Archive {...props} />,
  "caio-lenavisage/product": (props) => <ProductList {...props} />,
  "caio-lenavisage/customer": (props) => <CustomerList {...props} />,

  "*": () => (
    <Uu5Elements.Text category="story" segment="heading" type="h1">
      Not Found
    </Uu5Elements.Text>
  ),
};

const MENU_LIST = [
  { key: "identity" },
];

function CustomPage() {
  const session = useSession();

  let menuList = MENU_LIST;
  if (session.state === "authenticated") {
    menuList = [
      { href: "caio-lenavisage", collapsedChildren: "Home", icon: "uugdsstencil-layout-apps" },
      { href: "caio-lenavisage/order", collapsedChildren: "Archive", icon: "uugdsstencil-time-arrow-history" },
      ...menuList
    ];
  }

  return (
    <Page
      header={
        <Uu5Elements.Text category="interface" segment="title" type="common" className={Config.Css.css({ display: "inline-flex", alignItems: "center", gap: 8 })}>
          <img src={logoUri} alt="Lena Visage" height={32} /> Lena Visage
        </Uu5Elements.Text>
      }
      menuList={menuList}
      topColorScheme="pink"
    >
      <Router routeMap={ROUTE_MAP} />
    </Page>
  );
}

const Spa = createVisualComponent({
  uu5Tag: Config.TAG + "Spa",

  render() {
    return (
      <SpaProvider cmdPrefix="/caio-lenavisage/auth">
        <SpaView>
          <CustomPage />
        </SpaView>
      </SpaProvider>
    );
  },
});

export { Spa };
export default Spa;
