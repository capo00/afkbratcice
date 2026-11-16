// Text sizes come from uuGds tokens through `Uu5Elements.Text`, never a number
// (design/ux-design-system.md, 2.1; review 2026-11-12, S8). The test reads the sources and
// fails on a `fontSize` outside the list below, so a new hand-sized text is caught here.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));

// `file: count` of the allowed `fontSize`s, each with its reason. None of them is a text size.
const ALLOWED = {
  // Icon size: `Uu5Elements.Icon` has no size prop and takes the font size.
  "admin/screens/home.jsx": 1,
  "components/empty-state.jsx": 1,
  "routes/gallery.jsx": 1,
  // A glyph drawn to the size of a graphic: the card symbol on the pitch, the fallback
  // initials inside a team logo.
  "components/lineup-pitch/lineup-pitch.jsx": 1,
  "components/team-logo.jsx": 1,
  // The hero headline at 96 px, a recorded exception (design/ux-design-system.md, 2.3).
  "routes/home.jsx": 1,
};

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "assets" ? [] : sourceFiles(full);
    return /\.jsx?$/.test(entry.name) && !entry.name.endsWith(".test.js") ? [full] : [];
  });
}

test("no hand-set font size outside the allowed list", () => {
  const found = {};
  for (const file of sourceFiles(SRC)) {
    // Comments may name the property (theme.js explains why there is none).
    const code = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    const count = (code.match(/\bfontSize\s*:/g) ?? []).length;
    if (count) found[path.relative(SRC, file).split(path.sep).join("/")] = count;
  }
  assert.deepEqual(found, ALLOWED);
});
