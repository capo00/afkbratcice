/**
 * Scrapes match schedule from fotbal.cz and outputs SQL INSERT statements
 * Same output format as afk.rb
 *
 * Usage:
 *   npm run scrape                    - fetches from default URL
 *   npm run scrape -- schedule.html   - parses local HTML file (like afk.rb)
 *   node scrape.js <url-or-file>      - custom URL or local file path
 */

import * as cheerio from "cheerio";
import { readFileSync, existsSync } from "fs";
import puppeteer from "puppeteer";

// Team name to ID mapping (same as afk.rb)
const TEAMS = {
  "TJ AFK Bratčice": 1,
  "FK Chotusice 1932 B": 47,
  "TJ Dynamo Horní Bučice": 2,
  "Sokol Močovice": 50,
  "TJ Star Tupadly B": 12,
  "TJ Sokol Vlkaneč": 46,
  "SK Zbraslavice": 60,
  "SK Malešov B": 64,
  "SK Spartak Žleby": 35,
  "FK Záboří nad Labem": 38,
  "TJ Slovan Horky": 39,
  "FK Miskovice": 61,
  "Sokol Potěhy": 4,
  "TJ Sokol Paběnice B": 3,
  "TJ Sokol Malín": 63,
};

// žáci
// const TEAMS = {
//   "TJ Slavoj Vrdy": 22,
//   "TJ Jiskra Zruč nad Sázavou": 69,
//   "TJ Sokol Družba Suchdol": 19,
//   "FK Chotusice 1932": 20,
//   "TJ AFK Bratčice": 15,
//   "TJ Sokol Malín": 68,
//   "TJ Star Tupadly": 24,
//   "TJ Sokol Paběnice": 70,
//   "TJ Sokol Malín/SK Církvice": 68,
//   "Sparta Kutná Hora B": 67,
//   "FK Uhlířské Janovice": 66,
//   "FK Čáslav U15B": 72,
//   "SK Ronov nad Doubravou": 73,
// }

// dorost
// const TEAMS = {
//   "TJ Star Tupadly": 52,
//   "SK Ronov nad Doubravou": 79,
//   "FK Chotusice 1932": 78,
//   "TJ Sokol Družba Suchdol": 77,
//   "FK Uhlířské Janovice": 75,
//   "TJ Sokol Malín/Močovice": 74,
//   "TJ Slavoj Vrdy": 80,
//   "TJ Sokol Paběnice": 76,
//   "TJ AFK Bratčice": 81,
// }

async function getHtml(source) {
  if (existsSync(source)) {
    return readFileSync(source, "utf-8");
  }
  // Use Puppeteer for URLs (fotbal.cz returns 403 for direct HTTP requests)
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "darwin"
          ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
          : "google-chrome",
  });
  try {
    const page = await browser.newPage();
    await page.goto(source, { waitUntil: "networkidle2", timeout: 30000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}

async function scrape() {
  const source =
    process.argv[2] || process.env.URL || "schedule.html";
  const html = await getHtml(source);

  const $ = cheerio.load(html);
  const roundSections = $("section.js-matchRoundSection");

  if (roundSections.length === 0) {
    console.error("No match sections found.");
    console.error(
      "fotbal.cz uses Cloudflare protection - save the page manually in your browser:"
    );
    console.error("  1. Open the URL in Chrome/Firefox");
    console.error("  2. Complete any captcha/verification");
    console.error("  3. Save as schedule.html (Ctrl+S)");
    console.error("  4. Run: node scrape.js schedule.html");
    process.exit(1);
  }

  roundSections.each((_, roundEl) => {
    const $round = $(roundEl);
    const roundMatch = $round.find("div h2").first().text().match(/\d+/);
    const round = roundMatch ? roundMatch[0] : "1";

    const roundMatches = $round.find("ul li.js-matchRound");

    roundMatches.each((_, matchEl) => {
      const $match = $(matchEl);

      // Extract date from MatchRound-meta
      const dayText = $match
        .find("ul.MatchRound-meta li")
        .first()
        .find("p")
        .text()
        .replace(/\n/g, "")
        .replace(/\u00A0/g, " ");

      const dateMatch = dayText.match(
        /(\d+)\.\s*(\d+)\.\s*(\d+)\s+(\d+):(\d+)/
      );
      if (!dateMatch) return;

      const [, day, month, year, hour, minute] = dateMatch;
      const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")} ${hour}:${minute}:00`;

      // Extract teams from MatchRound-match
      const teamSpans = $match.find("a.MatchRound-match span.H7");
      const teamHome = $(teamSpans[0]).text().trim();
      const teamGuest = $(teamSpans[1]).text().trim();

      const idHome = TEAMS[teamHome];
      const idGuest = TEAMS[teamGuest];

      if (!idHome) {
        console.error(`${teamHome} not found`);
        process.exit(1);
      }
      if (!idGuest) {
        console.error(`${teamGuest} not found`);
        process.exit(1);
      }

      console.log(
        `INSERT INTO \`d27814_afk\`.\`zapas\` (\`kolo\`, \`datum\`, \`idD\`, \`idH\`) VALUES ('${round}', '${date}', ${idHome}, ${idGuest});`
      );
    });
  });
}

scrape().catch((err) => {
  console.error("Scraping failed:", err.message);
  process.exit(1);
});
