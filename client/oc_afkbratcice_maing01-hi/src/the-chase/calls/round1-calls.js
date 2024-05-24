import Calls from "./calls";

const Round1Calls = {
  loadQuestions(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round1/loadQuestions");
    return Calls.call("get", commandUri, dtoIn);
  },
};

export default Round1Calls;
