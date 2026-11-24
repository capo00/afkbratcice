import App from "./app.jsx";
import { setupTheme } from "./tools/theme-setup.js";
import { renderApp } from "./core/boot-screen.jsx";

// Globální styly, písma a klubová barva -- stejné jako v adminu (admin/index.jsx).
setupTheme();

// Boot screen z HTML vydrží až do hotové stránky (core/boot-screen.jsx). Až po `setupTheme`, ať
// `@font-face` z fonts.css existuje, když se začnou stahovat písma.
renderApp(<App />);
