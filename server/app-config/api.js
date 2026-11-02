import { getAppSettings } from "../app-settings/index.js";
import { validate, shape } from "../services/validators.js";

// BACKWARD-COMPAT (jedno vydání po 0.6.x, pak pryč): konfigurace klubu je od 2026-11 v Nastavení
// (`sys_settings.app`, server/app-settings/). Klient nové verze čte `sys/settings/get`; tenhle alias
// odpovídá klientovi, který má v prohlížeči ještě starý bundle, týmž tvarem jako dřív
// `appConfig/get` -- všechno pro kohokoli, jako dřív (doplněné o výchozí hodnoty, bez `id` a `sys`
// dokumentu). `appConfig/update` už není: ukládá se přes `sys/settings/update`.
export default {
  "appConfig/get": {
    method: "get",
    validator: validate(shape({})),
    fn: () => getAppSettings(),
  },
};
