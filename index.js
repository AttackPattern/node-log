const log = new (require('./lib/log').default)();
exports.log = log;
exports.UseAdHocLogPolicy = require('./lib/adHocPolicy').default(log);
