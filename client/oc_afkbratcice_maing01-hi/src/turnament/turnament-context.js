import OcElements from "../libs/oc_cli-elements";

const [TurnamentProvider, useTurnament] = OcElements.CrudContext.create("turnament");

export { TurnamentProvider, useTurnament };
