import OcElements from "../../libs/oc_cli-elements";

const [TournamentListProvider, useTournamentList] = OcElements.CrudContext.create("caio-tournament/tournament");

export { TournamentListProvider, useTournamentList };
