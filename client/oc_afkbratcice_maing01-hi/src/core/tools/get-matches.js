let TEAMS = {
  "FK Chotusice 1932 B": "671d7179f07fb9d019412ec2",
  "FK KAVALIER SÁZAVA B": "671d7190f07fb9d019412ec4",
  "FK Uhlířské Janovice B": "671d7097eb916497e042226e",
  "FK Záboří nad Labem": "671d6fa0eb916497e0422268",
  "SK Malešov B": "671d722af07fb9d019412eca",
  "SK Nepoměřice": "671d7252f07fb9d019412ece",
  "SK  Spartak Žleby": "671d7242f07fb9d019412ecc",
  "SK Zbraslavice": "671d70aceb916497e0422270",
  "Sokol Močovice": "671d7162f07fb9d019412ec0",
  "TJ AFK Bratčice": "671d6f8deb916497e0422266",
  "TJ Dynamo Horní Bučice": "671d71abf07fb9d019412ec6",
  "TJ Sokol Malín": "671d7085eb916497e042226c",
  "TJ Sokol Vlkaneč": "671d71c3f07fb9d019412ec8",
  "TJ Star Tupadly B": "671d6fbaeb916497e042226a",
};

// Season 2024 Muži III. třída (dev)
let seasonId = "671d72cdf07fb9d019412ecf";

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
