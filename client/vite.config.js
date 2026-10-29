import { createViteConfig } from "caio-devkit/vite";

// Statickou hlavičku pro roboty bez JS (popis z manifestu, `og:type`, `og:locale`, absolutní
// `og:image` z `APP_URL`) i `process.env.APP_URL` pro canonical dává caio-devkit sám.
export default createViteConfig();
