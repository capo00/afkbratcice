import { test } from "node:test";
import assert from "node:assert/strict";
import { mapsUrl, mailtoUrl, telUrl } from "./contact-links.js";

test("contact values become links", () => {
  assert.equal(
    mapsUrl("Bratčice 179, 286 01 Čáslav"),
    "https://www.google.com/maps/search/?api=1&query=Brat%C4%8Dice%20179%2C%20286%2001%20%C4%8C%C3%A1slav",
  );
  assert.equal(mailtoUrl("admin@afkbratcice.cz"), "mailto:admin@afkbratcice.cz");
  assert.equal(telUrl("+420 605 907 732"), "tel:+420605907732");
});

test("an empty value has no link", () => {
  assert.equal(mapsUrl(""), null);
  assert.equal(mailtoUrl(undefined), null);
  assert.equal(telUrl(null), null);
});
