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

// Změna profilu se projeví až po novém přihlášení -- profileList je zapečený v JWT.
console.log("Pozor: pokud jsi přihlášený, odhlas se a přihlas znovu, jinak se role neprojeví.");
process.exit(0);
