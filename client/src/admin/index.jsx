import { createRoot } from "react-dom/client";
import AdminApp from "./app.jsx";
import { setupTheme } from "../tools/theme-setup.js";

// Vstup UVE administrace (admin/index.html). Stejný start jako web (main.jsx): globální
// styly, písma a klubová barva před prvním renderem.
setupTheme();

createRoot(document.getElementById("root")).render(<AdminApp />);
