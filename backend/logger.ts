import log4js from "log4js";

log4js.configure({
  appenders: {
    stdout: { type: 'stdout' },
    credentials: { type: 'dateFile', filename: 'logs/credentials.log', pattern: ".yyyy-MM-dd.log", compress: true, }
  },
  categories: { default: { appenders: ['stdout', 'credentials'], level: 'info' } },
  pm2: true,
  pm2InstanceVar: 'INSTANCE_ID'
});

const logger = log4js.getLogger('credentials');
export default logger;