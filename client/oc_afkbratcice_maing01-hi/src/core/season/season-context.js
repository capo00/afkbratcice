import OcElements from "../../libs/oc_cli-elements";

const [SeasonProvider, useSeason] = OcElements.CrudContext.create("season");

export { SeasonProvider, useSeason };
