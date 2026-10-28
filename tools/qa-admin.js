// Lokální testovací správce pro ruční QA v prohlížeči (Caio 2026-10-28). Údaje jsou jen
// v `.env.development` (QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD), mimo git; skript odmítne běžet
// proti čemukoli jinému než lokálnímu Mongu. Idempotentní: účet založí, nebo mu jen
// obnoví roli a heslo. `node tools/qa-admin.js` / `node tools/qa-admin.js --delete`.
import "caio-server/src/caio-server-app/config/env.js";
import { Authentication } from "caio-server";

const { Identity, Member } = Authentication;
const { QA_ADMIN_EMAIL: email, QA_ADMIN_PASSWORD: password, MONGODB_URI: uri = "" } = process.env;

if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(uri)) {
  console.error("qa-admin: MONGODB_URI nemíří na lokální Mongo, končím.");
  process.exit(1);
}
if (!email || !password) {
  console.error("qa-admin: chybí QA_ADMIN_EMAIL nebo QA_ADMIN_PASSWORD v .env.development.");
  process.exit(1);
}

const { MongoClient } = await import("mongodb");
const mongo = new MongoClient(uri);
await mongo.connect();
const existing = await mongo.db().collection("sys_identity").findOne({ email });

if (process.argv.includes("--delete")) {
  if (existing) await Member.delete(existing.identity);
  const r = await mongo.db().collection("sys_identity").deleteMany({ email });
  console.log(`qa-admin: smazáno ${r.deletedCount}`);
} else {
  if (existing) {
    await Member.delete(existing.identity);
    await mongo.db().collection("sys_identity").deleteOne({ email });
  }
  const identity = await Identity.create({
    email, password, firstName: "QA", surname: "Admin", name: "QA Admin", emailVerified: true, registrationType: "password",
  });
  await Member.set(identity.identity, ["authorities"], { note: "QA admin (tools/qa-admin.js)" });
  console.log(`qa-admin: ${email} připraven (authorities)`);
}
await mongo.close();
process.exit(0);
