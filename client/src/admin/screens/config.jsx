import { createVisualComponent } from "uu5g05";
import { UiAuth } from "caio-ui";
import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import AdminScreen from "../screen.jsx";

// Nastavení: odchozí pošta, registrace a sekce klubu (upozornění, kontakt, sítě, pořadí kategorií,
// skrytá jména) -- jedna obrazovka, jedno Uložit. Samotnou obrazovku dělá `UiAuth.Settings` z caio-ui
// (`sys/settings/*`, role `authorities`); sekci klubu jí dává `SpaProvider settings` v admin/app.jsx
// (admin/settings.js).
//
// V rámu administrace (nadpis, zpátky na rozcestník, gutter sekce) jako správa identit
// (identities.jsx), proto ne `UiApp.settingsRouteMap()`: ta routu vykreslí bez rámu appky.
// Do 2026-11 vlastní formulář nad `appConfig/*`.

const AdminConfig = createVisualComponent({
  uu5Tag: Config.TAG + "AdminConfig",

  render() {
    return (
      <AdminScreen titleLsi={lsi("admin", "menu", "config", "header")}>
        <UiAuth.Settings header={null} nestingLevel="area" />
      </AdminScreen>
    );
  },
});

export default AdminConfig;
