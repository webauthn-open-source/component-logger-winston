"use strict";

const { DefaultLogger } = require("simple-component-manager");

const winston = require("winston");
const logger = new winston.Logger();

// timestamp formatting
function ts() {
    return Date.now();
}

// console logging formatting
function consoleFormatter(options) {
    let config = winston.config;
    var meta = options.meta || {};
    var component = meta.component || "unknown";
    var colorize = config.color ? config.colorize : (lvl, msg) => msg;
    delete meta.component;
    meta = Object.keys(meta).length ? `[[ ${JSON.stringify(meta)} ]]` : "";

    var message = options.message || "";
    var level = colorize(options.level, options.level.toUpperCase());
    var timestamp = (new Date()).toISOString();

    return `[${timestamp}] [${level}::${component}] ${message} ${(meta)}`;
}

var mainLogger = true;
module.exports = class WinstonLogger extends DefaultLogger {
    constructor(cm, name) {
        super(cm, name);

        this.transportList = [];
        this.configTable["add-transport"] = this.addTransport;
        this.logger = logger;
        this.winston = winston;

        // first logger created is our main logger -- it will handle the reconfig
        // XXX: this seems a little hacky, there's probably a better way
        this.mainLogger = mainLogger;
        mainLogger = false;

        this.reconfigure();
    }

    setLevel(level) {
        super.setLevel(level);

        this.reconfigure();
    }

    addTransport(transports) {
        if (!Array.isArray(transports)) {
            transports = [transports];
        }

        var transportList = [];
        for (let transport of transports) {
            if (typeof transport !== "object") {
                throw new TypeError("expected transport to be Object, got " + typeof transport);
            }

            // set default config options
            transport.timestamp = ts;

            switch (transport.type) {
                case "console":
                    // console.log("adding console transport");
                    transport.formatter = consoleFormatter;
                    transportList.push(new winston.transports.Console(transport));
                    break;
                case "file":
                    // console.log("adding file transport");
                    transportList.push(new winston.transports.File(transport));
                    break;
                default:
                    throw new Error("unknown transport type: " + transport.type);
            }
        }

        this.transportList = this.transportList.concat(transportList);
        // console.log("new transport list", this.transportList);

        this.reconfigure();
    }

    reconfigure() {
        if (!this.mainLogger) return;

        var config = {
            level: this.getLevel(),
            transports: this.transportList
        };

        // console.log("winston reconfigure", config);

        logger.configure(config);
    }

    print(levelStr, ...msg) {
        // console.log("WINSTON PRINT:", ...msg);
        logger.log(levelStr, ...msg, { component: this.name });
    }

    error(...msg) {
        this.print("error", ...msg);
    }

    warn(...msg) {
        this.print("warn", ...msg);
    }

    create(name) {
        return new WinstonLogger(this.cm, name);
    }
};
