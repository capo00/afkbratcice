// Založí prvního správce. Profil `authorities` nejde nastavit přes API -- identity smí
// editovat právě jen ta role, takže první musí vzniknout mimo něj.
//
//   node tools/seed-admin.js <email>
//
// Identita dostane kód `1-1-1`. Heslo se nenastavuje: správce se přihlásí přes Google
// nebo si ho nastaví přes "Zapomenuté heslo" na /login.html.

import "caio-server/src/caio-server-app/config/env.js";
import identityDao from "caio-server/src/caio-server-auth/dao/identity-dao.js";

const email = process.argv[2];
if (!email) {
  console.error("Použití: node tools/seed-admin.js <email>");
  process.exit(1);
}

const existing = await identityDao.findOne({ email });
const profileList = ["authorities"];

if (existing) {
  const merged = [...new Set([...(existing.profileList ?? []), ...profileList])];
  await identityDao.update({ id: existing.id, profileList: merged });
  console.log(`Identita ${existing.identity} (${email}) má nyní profily: ${merged.join(", ")}`);
} else {
  const cts = new Date().toISOString();
  const created = await identityDao.create({
    identity: "1-1-1",
    email,
    name: email,
    profileList,
    registrationType: "seed",
  });
  console.log(`Založena identita ${created.identity} (${email}) s profilem authorities.`);
  console.log("Heslo si nastav přes 'Zapomenuté heslo' na /login.html, nebo se přihlas přes Google.");
}

// Změna se projeví hned: role se od 7. 9. 2026 čtou z databáze při každém requestu, ne
// z JWT (caio-server, docs/auth.md, kapitola 9). Odhlašovat se není potřeba -- v prohlížeči
// jen stačí načíst stránku znovu, aby si klient přečetl `GET /auth`.
console.log("Role se projeví okamžitě; v otevřeném prohlížeči načti stránku znovu.");
process.exit(0);
