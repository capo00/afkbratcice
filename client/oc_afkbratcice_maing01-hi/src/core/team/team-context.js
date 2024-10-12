import OcElements from "../../libs/oc_cli-elements";

const [TeamProvider, useTeam] = OcElements.CrudContext.create("team");

export { TeamProvider, useTeam };
