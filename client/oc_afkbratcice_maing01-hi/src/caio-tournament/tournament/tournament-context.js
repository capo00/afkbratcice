import OcElements from "../../libs/oc_cli-elements";

const [TournamentProvider, useTournament] = OcElements.CrudContext.create("caio-tournament/tournament");

export { TournamentProvider, useTournament };
