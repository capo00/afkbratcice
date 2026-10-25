// Ta část caio-ui, kterou potřebuje veřejný web -- importovaná po modulech, ne z kořenového
// barrelu `caio-ui` (vzor z caio_propertyman `app.jsx`).
//
// Barrel reexportuje i `UiElements.Crud` (→ `uu5tilesg02*`, `uu5codekitg01-forms`) a `UiEcc`
// (→ `uu5richtextg01`). Balíček nemá `sideEffects: false`, takže je tree shaking nevyhodí
// a web by je stahoval jako statické závislosti `index.js`, i když žádnou tabulku nemá.
// SystemJS přitom `index.js` spustí až po stažení všech jeho statických importů.
//
// Co zbývá: `caio-ui-app` sahá na barrel `caio-ui-auth`, a ten táhne `uu5g05-forms`
// (`FormIdentitySelect`). To je bod 14 úklidu caio stacku -- oprava patří do caio-ui, ne sem.
//
// Administrace (admin/**) importuje z `caio-ui` normálně; tabulky a formuláře potřebuje.
// Hlídá to `lazy-libs.test.js`.
import UiApp from "caio-ui/src/caio-ui-app";
import { useSession } from "caio-ui/src/caio-ui-auth/session.jsx";
import { hasProfile, getScopeList } from "caio-ui/src/caio-ui-auth/profile.js";
import Call from "caio-ui/src/caio-ui-elements/call.js";
import Image from "caio-ui/src/caio-ui-elements/image.jsx";

const UiAuth = { useSession, hasProfile, getScopeList };
const UiElements = { Call, Image };

export { UiApp, UiAuth, UiElements };
