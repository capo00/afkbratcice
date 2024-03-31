import Calls from "./calls";

const Round3Calls = {
  loadQuestions(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/round3/loadQuestions");
    return Calls.call("get", commandUri, dtoIn);
  },
};

export default Round3Calls;
