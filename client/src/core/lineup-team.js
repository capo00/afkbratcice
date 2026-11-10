import { UiAuth } from "caio-ui";
import Config from "../config/config.js";

/**
 * Whose lineup may the signed-in user write in this match? An own team of the match (the
 * opponent has no roster) that he may edit: a match manager any, a team editor his own --
 * the same rule `match/setLineup` applies. A match of two own teams gets the first one.
 * Whether the team has a roster on the match day the match modal finds out (Caio 2026-11-10).
 *
 * Shared by the web (match-tile.jsx) and the admin (admin/screens/matches.jsx); it lives here
 * because the web must not import admin code statically (lazy-libs.test.js).
 */
function lineupTeamIdFor(identity, match, getTeam) {
  if (!identity) return undefined;
  const ownList = [match.homeTeamId, match.guestTeamId].filter((id) => id && getTeam(id)?.own);
  if (UiAuth.hasProfile(identity, Config.MATCH)) return ownList[0];
  const myTeamIdList = UiAuth.getScopeList(identity, Config.ROLE.TEAM_EDITOR);
  return ownList.find((id) => myTeamIdList.includes(id));
}

export { lineupTeamIdFor };
