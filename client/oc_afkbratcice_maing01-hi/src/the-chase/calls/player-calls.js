import Calls from "./calls";

const PlayerCalls = {
  create(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/create");
    return Calls.call("post", commandUri, dtoIn);
  },

  list(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/list");
    return Calls.call("get", commandUri, dtoIn);
  },

  get(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/get");
    return Calls.call("get", commandUri, dtoIn);
  },

  set(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/set");
    return Calls.call("post", commandUri, dtoIn);
  },

  setHunter(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/setHunter");
    return Calls.call("post", commandUri, dtoIn);
  },
};

export default PlayerCalls;
