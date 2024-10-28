function getTeamMap(teamList) {
  const teamMap = {};
  teamList.forEach((team) => (teamMap[team.id] = team));
  return teamMap;
}

module.exports = getTeamMap;
