"use strict";

const WinstonLogger = require("../index.js");
const assert = require("chai").assert;
const sinon = require("sinon");
const path = require("path");
const fs = require("fs");

function rmfile(filename) {
    try {
        fs.unlinkSync(filename);
    } catch (err) {
        // continue regardless of error
    }
}

var dummyComponentManager = {
    registerType: function() {},
    getType: function() {},
    register: function() {},
    get: function() {},
    clear: function() {},
    config: function() {},
    init: function() {},
    shutdown: function() {},
    componentList: new Map(),
    typeList: new Map()
};

describe("winston logger", function() {
    var c;
    beforeEach(function() {
        c = new WinstonLogger(dummyComponentManager);
    });

    afterEach(function() {
        c.shutdown();
    });

    it("exists", function() {
        var logger = new WinstonLogger(dummyComponentManager, "logger");
        assert.instanceOf(logger, WinstonLogger);
    });

    it("can set level before init");

    it("can set level", function() {
        var logger = new WinstonLogger(dummyComponentManager, "logger");
        logger.init();

        logger.config("set-level", "silent");
        assert.strictEqual(logger.debugLevel, 0);
        logger.config("set-level", "error");
        assert.strictEqual(logger.debugLevel, 1);
        logger.config("set-level", 4);
        assert.strictEqual(logger.debugLevel, 4);
    });

    it("errors on bad set levels", function() {
        var logger = new WinstonLogger(dummyComponentManager, "logger");
        logger.init();

        assert.throws(function() {
            logger.config("set-level", "foo");
        }, TypeError, /unknown level while configuring levels:/);
        assert.throws(function() {
            logger.config("set-level", "");
        }, TypeError, /unknown level while configuring levels:/);
        assert.throws(function() {
            logger.config("set-level", -1);
        }, TypeError, /unknown level while configuring levels:/);
        assert.throws(function() {
            logger.config("set-level", 8);
        }, TypeError, /unknown level while configuring levels:/);
    });

    it("can get level", function() {
        var logger = new WinstonLogger(dummyComponentManager, "logger");

        var lvl;
        // default
        lvl = logger.config("get-level");
        assert.strictEqual(lvl, "debug");

        // error level
        logger.config("set-level", "error");
        lvl = logger.config("get-level");
        assert.strictEqual(lvl, "error");

        // silent level
        logger.config("set-level", 0);
        lvl = logger.config("get-level");
        assert.strictEqual(lvl, "silent");
    });

    it("sets console transport", function() {
        var logger = new WinstonLogger(dummyComponentManager, "logger");
        assert.isArray(logger.transportList);
        assert.strictEqual(logger.transportList.length, 0);

        logger.addTransport({
            type: "console",
            colorize: true,
            json: false,
            // prettyPrint: true
        });

        logger.info("testing 1 2 3");

        assert.isArray(logger.transportList);
        assert.strictEqual(logger.transportList.length, 1);
    });

    it("sets file transport", function(done) {
        this.slow(500); // eslint-disable-line no-invalid-this
        var filename = path.join(__dirname, "test.log");
        rmfile(filename);
        var logger = new WinstonLogger(dummyComponentManager, "logger");
        logger.addTransport({
            type: "file",
            filename: filename
        });

        assert.isArray(logger.transportList);
        assert.strictEqual(logger.transportList.length, 1);

        logger.info("foo");

        // this is lame, but trying to flush winston isn't easy...
        setTimeout(() => {
            let fileContents = fs.readFileSync(filename, "utf8");
            let expectedContents = new RegExp(`{"component":"logger","level":"info","message":"foo","timestamp":\\d+}`);
            assert.match(fileContents, expectedContents);
            rmfile(filename);
            done();
        }, 100);
    });

    it("sets multiple transports");
});

describe("winston logger messages", function() {
    var log;
    var stdoutSpy, stderrSpy;

    beforeEach(function() {
        log = new WinstonLogger(dummyComponentManager, "logger");
        log.addTransport({
            type: "console",
            json: false,
            color: false
        });

        stdoutSpy = sinon.spy(process.stdout, "write");
        stderrSpy = sinon.spy(process.stderr, "write");
    });

    afterEach(function() {
        process.stdout.write.restore();
        process.stderr.write.restore();
    });

    it("catches right levels", function() {
        log.config("set-level", "error");
        log.error("something bad");
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR::logger\] something bad \n$/;
        assert.match(stderrSpy.args[0][0], msgRegExp);
        log.warn("will robinson");
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
    });

    it("error", function() {
        log.error("something bad");
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[ERROR::logger\] something bad \n$/;
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
        assert.match(stderrSpy.args[0][0], msgRegExp);
    });

    it("warn", function() {
        log.warn("will robinson");
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[WARN::logger\] will robinson \n$/;
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.match(stdoutSpy.args[0][0], msgRegExp);
    });

    it("info", function() {
        log.info("info test");
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[INFO::logger\] info test \n$/;
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.match(stdoutSpy.args[0][0], msgRegExp);
    });

    it("verbose", function() {
        log.verbose("verbose test");
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[VERBOSE::logger\] verbose test \n$/;
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.match(stdoutSpy.args[0][0], msgRegExp);
    });

    it("debug", function() {
        log.debug("debug test");
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[DEBUG::logger\] debug test \n$/;
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
        assert.match(stderrSpy.args[0][0], msgRegExp);
    });

    it("silly", function() {
        log.config("set-level", "silly");
        log.silly("silly test");
        let msgRegExp =
            /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] \[SILLY::logger\] silly test \n$/;
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.match(stdoutSpy.args[0][0], msgRegExp);
    });

    it("silent", function() {
        log.config("set-level", "silent");
        log.error("test");
        log.warn("test");
        log.info("test");
        log.verbose("test");
        log.debug("test");
        log.silly("test");
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 0);
    });

    it("correct console formatting");
});
