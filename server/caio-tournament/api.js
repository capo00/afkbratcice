const tournamentApi = require("./tournament/api");
const participantApi = require("./participant/api");
const matchApi = require("./match/api");
const historyLogApi = require("./history-log/api");

module.exports = { ...tournamentApi, ...participantApi, ...matchApi, ...historyLogApi };
