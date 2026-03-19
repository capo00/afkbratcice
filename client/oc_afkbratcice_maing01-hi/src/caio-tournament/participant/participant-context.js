import OcElements from "../../libs/oc_cli-elements";

const [ParticipantListProvider, useParticipantList] = OcElements.CrudContext.create("caio-tournament/participant");

export { ParticipantListProvider, useParticipantList };
