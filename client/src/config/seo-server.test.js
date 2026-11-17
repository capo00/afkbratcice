import { test } from "node:test";
import assert from "node:assert/strict";
import { ROUTE_SEO, SITE_NAME, HOME_DESCRIPTION, pageTitle } from "./seo.js";
import { seasonName } from "../core/season-label.js";
import * as Server from "../../../server/seo/route-seo.js";

// Server píše titulky a popisy do dokumentu sám (`server/seo/document.js`, náhled sdíleného
// odkazu) a má vlastní kopii tabulky, protože `client/` se nenasazuje. Tenhle test drží obě
// kopie stejné; je tady, ne na serveru, protože server z `client/` importovat nesmí
// (`server/test/no-client-imports.test.js`).

test("server má stejné titulky a popisy rout jako klient", () => {
  assert.deepEqual(Server.ROUTE_SEO, ROUTE_SEO);
  assert.equal(Server.SITE_NAME, SITE_NAME);
  assert.equal(Server.HOME_DESCRIPTION, HOME_DESCRIPTION);
});

test("server skládá titulek a název sezóny stejně jako klient", () => {
  for (const name of [null, "Kontakt"]) assert.equal(Server.pageTitle(name), pageTitle(name));
  for (const season of [{ competition: "III. třída", yearFrom: "2025" }, { competition: "Okresní přebor" }, {}, null]) {
    assert.equal(Server.seasonName(season), seasonName(season));
  }
});
