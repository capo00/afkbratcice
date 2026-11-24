import AdminApp from "./app.jsx";
import { setupTheme } from "../tools/theme-setup.js";
import { renderApp } from "../core/boot-screen.jsx";

// Vstup UVE administrace (admin/index.html). Stejný start jako web (main.jsx): globální
// styly, písma a klubová barva před prvním renderem.
setupTheme();

// Boot screen vydrží až do vykreslené obrazovky, jako na webu (core/boot-screen.jsx).
renderApp(<AdminApp />);
