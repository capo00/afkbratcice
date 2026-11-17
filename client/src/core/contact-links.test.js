import { test } from "node:test";
import assert from "node:assert/strict";
import { mapsUrl, mailtoUrl, telUrl } from "./contact-links.js";

test("contact values become links", () => {
  assert.equal(
    mapsUrl("Bratčice 100, 285 06"),
    "https://www.google.com/maps/search/?api=1&query=Brat%C4%8Dice%20100%2C%20285%2006",
  );
  assert.equal(mailtoUrl("admin@afkbratcice.cz"), "mailto:admin@afkbratcice.cz");
  assert.equal(telUrl("+420 605 907 732"), "tel:+420605907732");
});

test("an empty value has no link", () => {
  assert.equal(mapsUrl(""), null);
  assert.equal(mailtoUrl(undefined), null);
  assert.equal(telUrl(null), null);
});
