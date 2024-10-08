import { Environment } from "uu5g05";

function serializeDtoIn(dtoIn) {
  const newDtoIn = {};
  for (let k in dtoIn) {
    if (dtoIn[k] != null && typeof dtoIn[k] === "object") newDtoIn[k] = JSON.stringify(dtoIn[k]);
    else newDtoIn[k] = dtoIn[k];
  }
  return newDtoIn;
}

// the base URI of calls for development / staging environments can be configured in *-hi/env/development.json
// (or <stagingEnv>.json), e.g.:
//   "uu5Environment": {
//     "callsBaseUri": "http://localhost:8080/vnd-app/awid"
//   }
const CALLS_BASE_URI =
  (process.env.NODE_ENV !== "production" ? Environment.get("callsBaseUri") : null) || Environment.appBaseUri;

const Calls = {
  async call(method, url, dtoIn, clientOptions) {
    let data;
    if (method === "get") {
      if (dtoIn) {
        url = new URL(url);
        url.search = new URLSearchParams(serializeDtoIn(dtoIn));
      }
      const response = await fetch(url, clientOptions);
      data = await response.json();
    } else if (method === "post") {
      const response = await fetch(url, {
        ...clientOptions,
        headers: {
          "Content-Type": "application/json",
          ...clientOptions?.headers,
        },
        method: method.toUpperCase(),
        body: method === "post" && dtoIn ? JSON.stringify(dtoIn) : undefined,
      });
      data = await response.json();
    } else {
      throw new Error(`Invalid method "${method}".`);
    }
    return data;
  },

  init(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/init");
    return Calls.call("get", commandUri, dtoIn);
  },

  loadPlayers(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/list");
    return Calls.call("get", commandUri, dtoIn);
  },

  getPlayer(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/get");
    return Calls.call("get", commandUri, dtoIn);
  },

  addPlayer(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/add");
    return Calls.call("post", commandUri, dtoIn);
  },

  selectHunter(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/selectHunter");
    return Calls.call("post", commandUri, dtoIn);
  },

  loadQuestions1(dtoIn) {
    const commandUri = Calls.getCommandUri("theChase/player/question1/list");
    return Calls.call("get", commandUri, dtoIn);
  },

  // // example for mock calls
  // loadDemoContent(dtoIn) {
  //   const commandUri = Calls.getCommandUri("loadDemoContent");
  //   return Calls.call("get", commandUri, dtoIn);
  // },

  loadIdentityProfiles() {
    const commandUri = Calls.getCommandUri("sys/uuAppWorkspace/initUve");
    return Calls.call("get", commandUri);
  },

  initWorkspace(dtoInData) {
    const commandUri = Calls.getCommandUri("sys/uuAppWorkspace/init");
    return Calls.call("post", commandUri, dtoInData);
  },

  getWorkspace() {
    const commandUri = Calls.getCommandUri("sys/uuAppWorkspace/get");
    return Calls.call("get", commandUri);
  },

  async initAndGetWorkspace(dtoInData) {
    await Calls.initWorkspace(dtoInData);
    return await Calls.getWorkspace();
  },

  getCommandUri(useCase, baseUri = CALLS_BASE_URI) {
    return (!baseUri.endsWith("/") ? baseUri + "/" : baseUri) + (useCase.startsWith("/") ? useCase.slice(1) : useCase);
  },
};

export default Calls;
