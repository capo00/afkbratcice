import Config from "../config.js";

// Tabulka soutěže. Nejcitlivější kus serverové části: je to jediné místo, kde v1 udělal
// proti v0 regresi -- počítal jen 3/1/0 a neuměl penalty. Chování se drží v0
// (cmd/controller/getTable.php).

const FORM_LENGTH = 5;

function emptyRow(team) {
  return {
    team,
    played: 0,
    wins: 0,
    penaltyWins: 0,
    penaltyLosses: 0,
    losses: 0,
    draws: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    // Posledních pár výsledků jako W/D/L, nejnovější první. Padá ze stejného průchodu
    // daty, takže je zadarmo.
    form: [],
  };
}

/** Do tabulky vstupují jen odehrané soutěžní zápasy -- shodně s v0. */
function countsTowardsTable(match) {
  const hasScore = Number.isFinite(match.homeGoals) && Number.isFinite(match.guestGoals);
  // Prázdné `round` = přátelský zápas; ten tabulku zkreslit nesmí.
  const isCompetitive = match.round !== undefined && match.round !== null && match.round !== "";
  return hasScore && isCompetitive;
}

/**
 * @param matchList     zápasy jedné sezóny
 * @param teamList      účastníci soutěže (aby v tabulce byl i tým, který ještě nehrál)
 * @param hasPenalties  hraje se soutěž na penaltový rozstřel? Je to **vlastnost sezóny**
 *                      (`season.hasPenalties`), ne něco, co by se dalo poznat ze zápasů:
 *                      soutěž s rozstřelem, ve které zatím žádná remíza nebyla, vypadá
 *                      v datech úplně stejně jako soutěž bez něj -- a tabulka by se pak
 *                      po první remíze sama přepnula na jiné bodování.
 * @returns pole řádků seřazené podle pravidel v0
 */
function computeTable(matchList, teamList, hasPenalties = false) {
  const rowMap = new Map();
  for (const team of teamList) rowMap.set(team.id, emptyRow(team));

  function rowFor(teamId) {
    if (!rowMap.has(teamId)) rowMap.set(teamId, emptyRow({ id: teamId, name: "?" }));
    return rowMap.get(teamId);
  }

  // Vzájemné zápasy jako druhé kritérium: "A|B" -> body A proti B.
  const headToHead = new Map();
  function addHeadToHead(teamId, opponentId, points) {
    const key = teamId + "|" + opponentId;
    headToHead.set(key, (headToHead.get(key) ?? 0) + points);
  }

  const played = matchList.filter(countsTowardsTable).sort((a, b) => String(a.time ?? "").localeCompare(String(b.time ?? "")));

  for (const match of played) {
    const home = rowFor(match.homeTeamId);
    const guest = rowFor(match.guestTeamId);

    home.played++;
    guest.played++;
    home.goalsFor += match.homeGoals;
    home.goalsAgainst += match.guestGoals;
    guest.goalsFor += match.guestGoals;
    guest.goalsAgainst += match.homeGoals;

    let homePoints;
    let guestPoints;

    if (match.homeGoals > match.guestGoals) {
      home.wins++; guest.losses++;
      homePoints = Config.POINTS.win; guestPoints = Config.POINTS.loss;
      home.form.push("W"); guest.form.push("L");
    } else if (match.homeGoals < match.guestGoals) {
      guest.wins++; home.losses++;
      homePoints = Config.POINTS.loss; guestPoints = Config.POINTS.win;
      home.form.push("L"); guest.form.push("W");
    } else if (hasPenalties && match.penaltyWinnerTeamId) {
      // Remíza rozhodnutá penaltami: 2 body vítězi rozstřelu, 1 poraženému.
      const homeWon = match.penaltyWinnerTeamId === match.homeTeamId;
      if (homeWon) { home.penaltyWins++; guest.penaltyLosses++; } else { guest.penaltyWins++; home.penaltyLosses++; }
      homePoints = homeWon ? Config.POINTS.penaltyWin : Config.POINTS.penaltyLoss;
      guestPoints = homeWon ? Config.POINTS.penaltyLoss : Config.POINTS.penaltyWin;
      home.form.push(homeWon ? "W" : "L"); guest.form.push(homeWon ? "L" : "W");
    } else {
      // Soutěž bez rozstřelu -- remíza po bodu. Sem spadne i remíza se zapsaným vítězem
      // rozstřelu v soutěži, která ho nemá: rozhoduje nastavení sezóny, ne zápis
      // u zápasu, aby jeden překlep v administraci nezměnil bodování celé tabulky.
      home.draws++; guest.draws++;
      homePoints = Config.POINTS.draw; guestPoints = Config.POINTS.draw;
      home.form.push("D"); guest.form.push("D");
    }

    home.points += homePoints;
    guest.points += guestPoints;
    addHeadToHead(match.homeTeamId, match.guestTeamId, homePoints);
    addHeadToHead(match.guestTeamId, match.homeTeamId, guestPoints);
  }

  const rowList = [...rowMap.values()];
  for (const row of rowList) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    // Nejnovější první, jen posledních pár.
    row.form = row.form.slice(-FORM_LENGTH).reverse();
  }

  rowList.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    // Vzájemné zápasy: kdo z dvojice nabral víc bodů proti tomu druhému.
    const ab = headToHead.get(a.team.id + "|" + b.team.id) ?? 0;
    const ba = headToHead.get(b.team.id + "|" + a.team.id) ?? 0;
    if (ab !== ba) return ba - ab;

    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return String(a.team.name ?? "").localeCompare(String(b.team.name ?? ""), "cs");
  });

  return rowList.map((row, index) => ({ rank: index + 1, ...row }));
}

export { computeTable, countsTowardsTable };
