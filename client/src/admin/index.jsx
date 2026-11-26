import AdminApp from "./app.jsx";
import { setupTheme } from "../tools/theme-setup.js";
import { UiApp } from "caio-ui";
import { BOOT_OPTIONS } from "../tools/boot-options.js";

// Vstup UVE administrace (admin/index.html). Stejný start jako web (main.jsx): globální
// styly, písma a klubová barva před prvním renderem.
setupTheme();

// Boot screen vydrží až do vykreslené obrazovky, jako na webu (caio-ui `UiApp.renderApp`).
UiApp.renderApp(<AdminApp />, BOOT_OPTIONS);
