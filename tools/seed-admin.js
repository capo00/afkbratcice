// Založí prvního správce. Role `authorities` nejde přidělit přes API -- role smí měnit
// právě jen ta role, takže první musí vzniknout mimo něj.
//
//   node tools/seed-admin.js <email>
//
// Identita dostane kód `1-1-1`. Heslo se nenastavuje: správce se přihlásí přes Google
// nebo Facebook.
//
// Role **nejsou na identitě**: od caio-serveru 0.2.1 žijí v kolekci `sys_member` pod kódem
// identity (caio-server docs/auth.md, kapitola 10). Zápis do `identity.profileList` by
// server ignoroval.

import "caio-server/src/caio-server-app/config/env.js";
import { Authentication } from "caio-server";

const email = process.argv[2];
if (!email) {
  console.error("Použití: node tools/seed-admin.js <email>");
  process.exit(1);
}

const { Identity, Member } = Authentication;

let identity = await Identity.findByEmail(email);

if (!identity) {
  identity = await Identity.create({ identity: "1-1-1", email, name: email, registrationType: "seed" });
  console.log(`Založena identita ${identity.identity} (${email}).`);
  console.log("Přihlas se přes Google nebo Facebook -- účet se spáruje přes ověřenou e-mailovou adresu.");
}

// Přičítá, nepřepisuje: skript se pouští i na účet, který už nějaké role má, a smyslem je
// dodat `authorities`, ne sebrat zbytek.
const current = await Member.getProfileList(identity.identity);
const merged = [...new Set([...current, "authorities"])];
await Member.set(identity.identity, merged, { note: "seed-admin" });

console.log(`Identita ${identity.identity} (${email}) má nyní role: ${merged.join(", ")}`);

// Změna se projeví hned: role se čtou z databáze při každém requestu, ne z JWT
// (caio-server, docs/auth.md, kapitoly 9 a 10). Odhlašovat se není potřeba -- v prohlížeči
// jen stačí načíst stránku znovu, aby si klient přečetl `GET /auth`.
console.log("Role se projeví okamžitě; v otevřeném prohlížeči načti stránku znovu.");
process.exit(0);
