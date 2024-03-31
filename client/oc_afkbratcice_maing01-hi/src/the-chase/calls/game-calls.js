import Calls from "./calls";

const GameCalls = {
  init(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/game/init");
    return Calls.call("post", commandUri, dtoIn);
  },

  get(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/game/get");
    return Calls.call("get", commandUri, dtoIn);
  },

  set(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/game/set");
    return Calls.call("post", commandUri, dtoIn);
  },

  setHunter(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/game/setHunter");
    return Calls.call("post", commandUri, dtoIn);
  },

  destroy(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/game/destroy");
    return Calls.call("post", commandUri, dtoIn);
  },
};

export default GameCalls;
