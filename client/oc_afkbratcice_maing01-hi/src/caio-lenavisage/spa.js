import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { SpaProvider, Spa as SpaView } from "../libs/oc_cli-app";
import Page from "../libs/oc_cli-app/page";
import Router from "../core/router.js";
import Wizard from "./home/wizard.js";
import Archive from "./archive/archive.js";
import ProductList from "./product/product-list.js";
import CustomerList from "./customer/customer-list.js";

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
  { href: "caio-lenavisage", collapsedChildren: "Home", icon: "uugdsstencil-layout-apps" },
  { href: "caio-lenavisage/order", collapsedChildren: "Archive", icon: "uugdsstencil-time-arrow-history" },
  { key: "identity" },
];

const Spa = createVisualComponent({
  uu5Tag: Config.TAG + "Spa",

  render() {
    return (
      <SpaProvider cmdPrefix="/caio-lenavisage/auth">
        <SpaView>
          <Page
            header={
              <Uu5Elements.Text category="interface" segment="title" type="common">
                Lena Visage
              </Uu5Elements.Text>
            }
            menuList={MENU_LIST}
            topColorScheme="pink"
          >
            <Router routeMap={ROUTE_MAP} />
          </Page>
        </SpaView>
      </SpaProvider>
    );
  },
});

export { Spa };
export default Spa;
