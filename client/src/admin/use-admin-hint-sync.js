import { useEffect } from "uu5g05";
import { UiAuth } from "caio-ui";
import { setAdminHint, clearAdminHint } from "../tools/admin-hint.js";
import { ANY_ADMIN_PROFILE } from "../config/admin-menu.js";

/**
 * Drží značku pro web (tools/admin-hint.js) v souladu s tím, kdo je v administraci přihlášený.
 * Přihlášený s rolí, která otevře aspoň jednu obrazovku → značka je; přihlášený bez ní →
 * značka pryč. Dokud session nenaběhla (`pending`) nebo nikdo není přihlášený, se značkou
 * se nic neděje -- po odhlášení tedy odkaz na webu zůstane a příště se přihlásí tady.
 */
export function useAdminHintSync() {
  const { state, identity } = UiAuth.useSession();
  useEffect(() => {
    if (state !== "authenticated") return;
    if (UiAuth.hasProfile(identity, ANY_ADMIN_PROFILE)) setAdminHint();
    else clearAdminHint();
  }, [state, identity]);
}

export default useAdminHintSync;
