const tournamentApi = require("./tournament/api");
const participantApi = require("./participant/api");
const matchApi = require("./match/api");
const auditLogApi = require("./audit-log/api");

module.exports = { ...tournamentApi, ...participantApi, ...matchApi, ...auditLogApi };
