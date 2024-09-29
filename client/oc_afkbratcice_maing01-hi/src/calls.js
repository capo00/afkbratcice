import { Environment } from "uu5g05";
import { Call } from "./libs/oc_cli-app"

// the base URI of calls for development / staging environments can be configured in *-hi/env/development.json
// (or <stagingEnv>.json), e.g.:
//   "uu5Environment": {
//     "callsBaseUri": "http://localhost:8080/vnd-app/awid"
//   }
const CALLS_BASE_URI =
  (process.env.NODE_ENV !== "production" ? Environment.get("callsBaseUri") : null) || Environment.appBaseUri;

const Calls = {
  loadTeams(dtoIn) {
    const commandUri = Calls.getCommandUri("team/list");
    return Call.get(commandUri, dtoIn);
  },

  createBinary(dtoIn) {
    const commandUri = Calls.getCommandUri("binary/create");
    return Call.post(commandUri, dtoIn);
  },

  // // example for mock calls
  // loadDemoContent(dtoIn) {
  //   const commandUri = Calls.getCommandUri("loadDemoContent");
  //   return Calls.call("get", commandUri, dtoIn);
  // },

  // loadIdentityProfiles() {
  //   const commandUri = Calls.getCommandUri("sys/uuAppWorkspace/initUve");
  //   return Call.get(commandUri);
  // },
  //
  // initWorkspace(dtoInData) {
  //   const commandUri = Calls.getCommandUri("sys/uuAppWorkspace/init");
  //   return Call.post(commandUri, dtoInData);
  // },
  //
  // getWorkspace() {
  //   const commandUri = Calls.getCommandUri("sys/uuAppWorkspace/get");
  //   return Call.get(commandUri);
  // },
  //
  // async initAndGetWorkspace(dtoInData) {
  //   await Calls.initWorkspace(dtoInData);
  //   return await Calls.getWorkspace();
  // },

  getCommandUri(useCase, baseUri = CALLS_BASE_URI) {
    return (!baseUri.endsWith("/") ? baseUri + "/" : baseUri) + (useCase.startsWith("/") ? useCase.slice(1) : useCase);
  },
};

export default Calls;
