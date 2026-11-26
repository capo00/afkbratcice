import App from "./app.jsx";
import { setupTheme } from "./tools/theme-setup.js";
import { UiApp } from "caio-ui";
import { BOOT_OPTIONS } from "./tools/boot-options.js";

// Globální styly, písma a klubová barva -- stejné jako v adminu (admin/index.jsx).
setupTheme();

// Boot screen z HTML vydrží až do hotové stránky (caio-ui `UiApp.renderApp`). Až po `setupTheme`, ať
// `@font-face` z fonts.css existuje, když se začnou stahovat písma.
UiApp.renderApp(<App />, BOOT_OPTIONS);
