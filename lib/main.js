"use strict";

const Component = require("component-class");
const winston = require("winston");
const Logger = winston.Logger;

module.exports = class WinstonLogger extends Component {
    constructor(cm, name) {
        super(cm);

        this.debugLevels = [
            "silent",
            "error",
            "warn",
            "info",
            "verbose",
            "debug",
            "silly"
        ];

        this.name = name || "unknown";

        this.configTable["set-level"] = this.setLevel;
        this.configTable["get-level"] = this.getLevel;
        this.configTable["add-transport"] = this.addTransport;

        this.setLevel("debug");
        this.transportList = [];

        this.reconfigure();
    }

    setLevel(level) {
        if (typeof level === "number" &&
            level < this.debugLevels.length &&
            level >= 0) {
            // console.log("setting level to:", level);
            this.debugLevel = level;
            this.reconfigure();
            return;
        }

        let levelStr = level;
        level = this.debugLevels.indexOf(level);
        if (typeof levelStr === "string" &&
            level < this.debugLevels.length &&
            level >= 0) {
            // console.log("setting level to:", level);
            this.debugLevel = level;
            this.reconfigure();
            return;
        }

        throw new TypeError("unknown level while configuring levels: " + level);
    }

    getLevel() {
        return this.debugLevels[this.debugLevel];
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

            switch (transport.type) {
                case "console":
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
        var config = {
            level: this.getLevel(),
            transports: this.transportList
        };

        // console.log("config", config);

        winston.configure(config);
    }

    print(levelStr, ...msg) {
        winston.log(levelStr, ...msg, { component: this.name });
    }

    error(...msg) {
        this.print("error", ...msg);
    }

    warn(...msg) {
        this.print("warn", ...msg);
    }

    info(...msg) {
        this.print("info", ...msg);
    }

    verbose(...msg) {
        this.print("verbose", ...msg);
    }

    debug(...msg) {
        this.print("debug", ...msg);
    }

    silly(...msg) {
        this.print("silly", ...msg);
    }

    create(name) {
        return new WinstonLogger(this.cm, name);
    }
};