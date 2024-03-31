import Calls from "./calls";

const Round2Calls = {
  init(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/init");
    return Calls.call("post", commandUri, dtoIn);
  },

  load(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/load");
    return Calls.call("get", commandUri, dtoIn);
  },

  get(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/get");
    return Calls.call("get", commandUri, dtoIn);
  },

  setOffer(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/setOffer");
    return Calls.call("post", commandUri, dtoIn);
  },

  confirmOffer(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/confirmOffer");
    return Calls.call("post", commandUri, dtoIn);
  },

  loadQuestion(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/loadQuestion");
    return Calls.call("post", commandUri, dtoIn);
  },

  setAnswer(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round2/setAnswer");
    return Calls.call("post", commandUri, dtoIn);
  },
};

export default Round2Calls;
