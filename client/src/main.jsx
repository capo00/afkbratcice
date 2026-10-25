import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import { setupTheme } from "./tools/theme-setup.js";

// Globální styly, písma a klubová barva -- stejné jako v adminu (admin/index.jsx).
setupTheme();

createRoot(document.getElementById("root")).render(<App />);
