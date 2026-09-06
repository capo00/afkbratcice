import { createVisualComponent, useRoute, useLsi, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { UiAuth } from "caio-ui";
import Config from "../../config/config.js";
import importLsi, { lsi } from "../../lsi/import-lsi.js";
import Section from "../../components/layout/section.jsx";
import Heading from "../../components/layout/heading.jsx";
import Card from "../../components/layout/card.jsx";
import { ADMIN_MENU } from "../../admin/menu.js";

const { theme } = Config;

// Rozcestník administrace. Ukazuje **jen to, na co přihlášený opravdu má** — fotograf
// nemá vidět správu identit ani zašedlou (frontend.md, 2.2).

const AdminIndex = createVisualComponent({
  uu5Tag: Config.TAG + "AdminIndex",

  render() {
    const [, setRoute] = useRoute();
    const session = UiAuth.useSession();
    const titleLsi = useLsi(importLsi, ["admin", "menu"]);

    const itemList = ADMIN_MENU.filter((item) => UiAuth.hasProfile(session.identity, item.profileList));

    return (
      <Section>
        <Heading eyebrow={lsi("admin", "eyebrow")} lsi={lsi("admin", "header")} />

        <div
          className={Config.Css.css({
            marginBlockStart: 24,
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          })}
        >
          {itemList.map((item) => (
            <Card key={item.code} onClick={() => setRoute(item.route)}>
              <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12 })}>
                <Uu5Elements.Icon
                  icon={item.icon}
                  className={Config.Css.css({ fontSize: 24, color: theme.color.clubRed })}
                />
                <div>
                  <div className={Config.Css.css({ ...theme.typography.display, fontSize: 18 })}>
                    {titleLsi[item.code]?.header ?? item.code}
                  </div>
                  <Uu5Elements.Text
                    category="interface"
                    segment="content"
                    type="medium"
                    className={Config.Css.css({ color: theme.color.mutedFg })}
                  >
                    {titleLsi[item.code]?.desc}
                  </Uu5Elements.Text>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {itemList.length === 0 ? (
          <Uu5Elements.Text category="interface" segment="content" type="medium">
            <Lsi import={importLsi} path={["admin", "empty"]} />
          </Uu5Elements.Text>
        ) : null}
      </Section>
    );
  },
});

export default AdminIndex;
