import Config from "../config.js";

// teamEditor je jediná role s rozsahem: váže se ke konkrétnímu týmu a rozsah je zapsaný
// v názvu profilu (`teamEditor:<teamId>`), protože profileList je plochý seznam stringů,
// který jde beze změny do JWT. Detail a jeho úskalí: design/roles.md, sekce 3.

const PREFIX = Config.ROLE.TEAM_EDITOR + ":";

/** Týmy, které volající spravuje. Prázdné pole = není teamEditor. */
function myTeamIdList(identity) {
  return (identity?.profileList ?? []).filter((p) => p.startsWith(PREFIX)).map((p) => p.slice(PREFIX.length));
}

function hasRole(identity, roleList) {
  const profileList = identity?.profileList ?? [];
  return profileList.some((p) => roleList.includes(p));
}

/**
 * `auth` funkce pro use case, kde smí i editor konkrétního týmu.
 *
 * @param resolveTeamIdList async (dtoIn) => string[] -- kterých týmů se dtoIn týká
 * @param baseRoleList      role, které projdou bez ohledu na tým
 * @param mode              "any" = stačí jeden můj tým (zápas má dva), "all" = všechny moje
 */
function teamScoped(resolveTeamIdList, baseRoleList, mode = "all") {
  return async ({ dtoIn, identity }) => {
    if (!identity) return false;
    if (hasRole(identity, baseRoleList)) return true;

    const mine = myTeamIdList(identity);
    if (!mine.length) return false;

    const target = (await resolveTeamIdList(dtoIn)).filter(Boolean);
    if (!target.length) return false;

    return mode === "any"
      ? target.some((id) => mine.includes(id))
      : target.every((id) => mine.includes(id));
  };
}

/** Prostá kontrola rolí -- `auth: [...]` s tím, že vrací i pro nepřihlášeného false. */
function roleAuth(roleList) {
  return async ({ identity }) => Boolean(identity) && hasRole(identity, roleList);
}

/**
 * Projde plošná role, nebo kdokoli, kdo spravuje *nějaký* tým -- bez ohledu na který.
 * Pro operace, které nejsou vázané na konkrétní tým, ale nemají být otevřené všem:
 * typicky založení osoby, kterou pak editor dá na svoji soupisku.
 */
function anyTeamEditor(roleList) {
  return async ({ identity }) =>
    Boolean(identity) && (hasRole(identity, roleList) || myTeamIdList(identity).length > 0);
}

export { myTeamIdList, hasRole, teamScoped, roleAuth, anyTeamEditor };
