import "./no-db.js";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DISALLOWED_PATH_LIST, buildRobotsTxt, getBaseUrl } from "../seo/api.js";

// Prefixy use casů appky přímo z `server/*/api.js` ("team/list" -> "/team/"). Nový modul bez
// řádku v robots.txt by jinak tiše skončil ve výsledcích vyhledávání.
function apiPrefixList() {
  const root = new URL("../", import.meta.url);
  const prefixes = new Set();
  for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
    const file = new URL(`${dir.name}/api.js`, root);
    if (!dir.isDirectory() || !fs.existsSync(file)) continue;
    for (const m of fs.readFileSync(file, "utf8").matchAll(/^\s+"([a-zA-Z]+)\/[a-zA-Z]+": \{/gm)) prefixes.add(`/${m[1]}/`);
  }
  return [...prefixes];
}

test("robots.txt zakazuje každý prefix use casů appky", () => {
  const missing = apiPrefixList().filter((p) => !DISALLOWED_PATH_LIST.includes(p));
  assert.deepEqual(missing, []);
});

test("robots.txt zakazuje administraci a odkazuje na sitemapu", () => {
  const txt = buildRobotsTxt("https://www.afkbratcice.cz");
  assert.match(txt, /^User-agent: \*$/m);
  assert.match(txt, /^Disallow: \/admin$/m);
  assert.match(txt, /^Sitemap: https:\/\/www\.afkbratcice\.cz\/sitemap\.xml$/m);
});

function fakeReq(headers, protocol = "http") {
  return { protocol, get: (name) => headers[name.toLowerCase()] };
}

test("adresa webu za proxy App Engine je https podle X-Forwarded-Proto", () => {
  const saved = process.env.APP_URL;
  delete process.env.APP_URL;
  try {
    assert.equal(getBaseUrl(fakeReq({ host: "afkbratcice.oa.r.appspot.com", "x-forwarded-proto": "https" })), "https://afkbratcice.oa.r.appspot.com");
    assert.equal(getBaseUrl(fakeReq({ host: "localhost:8082" })), "http://localhost:8082");
  } finally {
    if (saved !== undefined) process.env.APP_URL = saved;
  }
});

test("APP_URL má přednost a koncové lomítko se ořízne", () => {
  const saved = process.env.APP_URL;
  process.env.APP_URL = "https://www.afkbratcice.cz/";
  try {
    assert.equal(getBaseUrl(fakeReq({ host: "x" })), "https://www.afkbratcice.cz");
  } finally {
    if (saved === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = saved;
  }
});
