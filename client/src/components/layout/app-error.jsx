import Config from "../../config/config.js";
import { lsi } from "../../lsi/import-lsi.js";
import { ErrorState } from "../data-state.jsx";
import { BootReady } from "../../core/boot-screen.jsx";

// Chyba při vykreslení (ErrorBoundary `UiApp.Spa`) na webu i v administraci. Výchozí `SpaError`
// z caio-ui je holé „Unexpected error“ s JSONem; tady stejná chybová obrazovka jako při selhání
// startu (core/app-context.jsx) s novým načtením stránky. `BootReady`: chyba je hotová obrazovka,
// boot screen se pustí hned, ne až pojistkou (core/boot-screen.jsx).
function AppError() {
  return (
    <div className={Config.Css.css({ maxWidth: 640, marginInline: "auto", padding: "64px 16px" })}>
      <ErrorState lsi={lsi("common", "appLoadError")} onRetry={() => window.location.reload()} />
      <BootReady />
    </div>
  );
}

export { AppError };
export default AppError;
