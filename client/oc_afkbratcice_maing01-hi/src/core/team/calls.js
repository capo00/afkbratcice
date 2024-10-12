import OcElements from "../../libs/oc_cli-elements";
import Calls from "../../calls";

const ENTITY = "team";

export default {
  load: (dtoIn) => OcElements.Call.cmdGet(Calls.getCommandUri(ENTITY + "/list"), dtoIn),
  createItem: (dtoIn) => OcElements.Call.cmdPost(Calls.getCommandUri(ENTITY + "/create"), dtoIn),
  updateItem: (dtoIn) => OcElements.Call.cmdPost(Calls.getCommandUri(ENTITY + "/update"), dtoIn),
  deleteItem: (dtoIn) => OcElements.Call.cmdPost(Calls.getCommandUri(ENTITY + "/delete"), dtoIn),
};
