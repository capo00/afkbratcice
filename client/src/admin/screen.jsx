import { createVisualComponent, useRoute, Lsi } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import Config from "../config/config.js";
import { lsi } from "../lsi/import-lsi.js";
import Section from "../components/layout/section.jsx";
import Heading from "../components/layout/heading.jsx";

const { theme } = Config;

// Rám obrazovky administrace: nadpis, zpátky na rozcestník a obsah.
//
// Administrace **nemá vlastní layout** — jede v témže rámu jako web (lišta, patička,
// sekce), jen bez hero a šrafování. Dvojí kostra by znamenala dvakrát řešit lištu, přihlášení
// i mobilní chování, a to všechno kvůli deseti tabulkám.
//
// Tabulky `uu5tilesg02` sázejí text vlastní typografií a na tmavém podkladu potřebují vědět,
// že je tmavý — o to se stará `BackgroundProvider` uvnitř `Section`.

const AdminScreen = createVisualComponent({
  uu5Tag: Config.TAG + "AdminScreen",

  render({ titleLsi, children }) {
    const [, setRoute] = useRoute();

    return (
      <Section>
        <div className={Config.Css.css({ display: "flex", alignItems: "center", gap: 12, marginBlockEnd: 24 })}>
          <Uu5Elements.Button
            icon="uugds-chevron-left"
            significance="subdued"
            colorScheme="building"
            onClick={() => setRoute("admin")}
            tooltip="Zpět na administraci"
          />
          <Heading eyebrow={lsi("admin", "eyebrow")} lsi={titleLsi} />
        </div>

        {children}
      </Section>
    );
  },
});

export default AdminScreen;
