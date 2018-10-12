const {createLogger, format, transports} = require('winston');
const {combine, timestamp, label, printf} = format;
const moment = require('moment');

//Sets proper time zone to timestamp
const timestamp2 = moment().format('DD-MM-YYYY HH:mm:ss');

const myFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const errorLogFile = './logger/error.log';
const combinedLogFile = './logger/combined.log';
const exceptionFile = './logger/exceptions.log';

const logger = createLogger({
    format: combine(
        label({label: 'Local'}),
        timestamp(),
        myFormat
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new transports.File({
            filename: errorLogFile,
            level: 'error'
        }),
        new transports.File({
            filename: combinedLogFile
        })
    ]
});

// Call exceptions.handle with a transport to handle exceptions
logger.exceptions.handle(
    new transports.File({filename: exceptionFile})
);

logger.level = 'silly';

function log(module, type, message) {
    switch (type) {
        case 'emergency':
            logger.emerg(JSON.stringify({
                module: module,
                message: message
            }));
            break;

        case 'alert':
            logger.alert(JSON.stringify({
                module: module,
                message: message
            }));
            break;

        case 'critical':
            logger.crit(JSON.stringify({
                module: module,
                message: message
            }));
            break;

        case 'error':
            logger.error(JSON.stringify({
                module: module,
                message: message
            }));
            break;

        case 'warning':
            logger.warn(JSON.stringify({
                module: module,
                message: message
            }));
            break;

        case 'notice':
            logger.notice(JSON.stringify({
                module: module,
                message: message
            }));
            break;

        case 'info':
            logger.info(JSON.stringify({
                module: module,
                message: message
            }));
            break;
        case 'debug':
            logger.debug(JSON.stringify({
                module: module,
                message: message
            }));
            break;
        default:
            logger.log('silly', JSON.stringify({
                module: module,
                message: message
            }));
            break;

    }

}

module.exports = log;