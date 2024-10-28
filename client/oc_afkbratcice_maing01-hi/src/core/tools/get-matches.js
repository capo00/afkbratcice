let TEAMS = {
  "FK Chotusice 1932 B": "671f0114d71ca3be5d7a8a6b",
  "FK KAVALIER SÁZAVA B": "671f0182d71ca3be5d7a8a76",
  "FK Uhlířské Janovice B": "671f019cd71ca3be5d7a8a7a",
  "FK Záboří nad Labem": "671f00e0d71ca3be5d7a8a67",
  "SK Malešov B": "671f0126d71ca3be5d7a8a6d",
  "SK Nepoměřice": "671f0156d71ca3be5d7a8a73",
  "SK  Spartak Žleby": "671f018fd71ca3be5d7a8a78",
  "SK Zbraslavice": "671f01a9d71ca3be5d7a8a7c",
  "Sokol Močovice": "671f016cd71ca3be5d7a8a74",
  "TJ AFK Bratčice": "671f00b9d71ca3be5d7a8a63",
  "TJ Dynamo Horní Bučice": "671f0105d71ca3be5d7a8a69",
  "TJ Sokol Malín": "671f00ced71ca3be5d7a8a65",
  "TJ Sokol Vlkaneč": "671f0144d71ca3be5d7a8a71",
  "TJ Star Tupadly B": "671f0136d71ca3be5d7a8a6f",
};

// Season 2024 Muži III. třída (dev)
let seasonId = "671f01c1d71ca3be5d7a8a7d";

let matches = [];

let rounds = document.querySelectorAll("section.js-matchRoundSection");
let round = 1;

rounds.forEach((roundEl) => {
  // Extract round number from the header
  const header = roundEl.querySelector("div > h2");
  round = header ? +header.textContent.match(/\d+/)[0] : round;

  // Find all matches within this round
  const roundMatches = roundEl.querySelectorAll("ul li.js-matchRound");

  roundMatches.forEach((roundMatch) => {
    // Extract the date and time information
    const dayElement = roundMatch.querySelector("ul.MatchRound-meta li p");
    let dayText = dayElement ? dayElement.textContent.replace(/\n/g, "").replace(/\u00A0/g, " ") : "";

    // Match and format the date and time
    const dateMatch = dayText.match(/(\d+)\.\s*(\d+)\.\s*(\d+)\s+(\d+):(\d+)/);
    let time;
    if (dateMatch) {
      time = new Date(dateMatch[3], +dateMatch[2] - 1, dateMatch[1], dateMatch[4], dateMatch[5]).toISOString();
    }

    // Score
    const score = roundMatch.querySelector("strong.u-c-tertiary")?.textContent;
    let homeGoals, guestGoals;
    if (score) {
      const [h, g] = score.split(":");
      homeGoals = +h;
      guestGoals = +g;
    }

    // Extract team names
    const teams = roundMatch.querySelectorAll("a.MatchRound-match span.H7");
    const teamHome = teams[0] ? teams[0].textContent.trim() : null;
    const teamGuest = teams[1] ? teams[1].textContent.trim() : null;

    // Find team IDs
    const homeTeamId = TEAMS[teamHome];
    const guestTeamId = TEAMS[teamGuest];

    // Check if teams were found in the TEAMS dictionary
    if (!homeTeamId) {
      console.error(`${teamHome} not found`);
      return;
    }

    if (!guestTeamId) {
      console.error(`${teamGuest} not found`);
      return;
    }

    matches.push({
      seasonId,
      round,
      time,
      homeTeamId,
      guestTeamId,
      homeGoals,
      guestGoals,
    });
  });
});

console.log("matches", JSON.stringify(matches));
