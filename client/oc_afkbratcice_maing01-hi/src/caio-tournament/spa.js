import { createVisualComponent } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "./config/config.js";
import { SpaProvider, Spa as SpaView } from "../libs/oc_cli-app";
import Page from "../libs/oc_cli-app/page";
import Router from "../core/router.js";
import TournamentList from "./tournament/tournament-list.js";
import TournamentDetail from "./tournament/tournament-detail.js";

const ROUTE_MAP = {
  "caio-tournament": { redirect: "caio-tournament/tournament" },
  "caio-tournament/tournament": (props) => {
    return props.params?.id
      ? <TournamentDetail {...props} id={props.params.id} />
      : <TournamentList {...props} />;
  },

  "*": () => (
    <Uu5Elements.Text category="story" segment="heading" type="h1">
      Not Found
    </Uu5Elements.Text>
  ),
};

const Spa = createVisualComponent({
  uu5Tag: Config.TAG + "Spa",

  render() {
    return (
      <SpaProvider>
        <SpaView>
          <Page menuList={[{ key: "identity" }]}>
            <Router routeMap={ROUTE_MAP} />
          </Page>
        </SpaView>
      </SpaProvider>
    );
  },
});

export { Spa };
export default Spa;
