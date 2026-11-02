// Konfigurace jen pro server, vrstva 2 (caio-devkit README, „Konfigurace appky“). Klíče 1. úrovně
// jsou standardní -- caio-server je zná a validuje v `App.init` (neznámý klíč start shodí); appka
// soubor předává `App.init({ config })` v index.js a skript `runScript({ config })`.
// Vlastní hodnoty serveru jsou jen pod `app`: to, co se opakuje ve víc souborech serveru.
// Jednomístné konstanty (bodování tabulky, začátek sezóny) zůstávají v config.js.
export default {
  // Kódy chyb `afkbratcice/<modul>/<chyba>` -- `Error.code("article", "notFound")`.
  errorPrefix: "afkbratcice",
  // Platnost přihlášení (do 2026-11 JWT_LIFETIME v .env; hodnota tady má přednost).
  auth: { jwtLifetime: "8h" },

  app: {
    // Rozlišení binárky uvnitř kolekce (`binary/*` `type`).
    binaryType: { photo: "photo", photoThumb: "photoThumb", logo: "logo", document: "document" },
  },
};
