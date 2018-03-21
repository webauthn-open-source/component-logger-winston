"use strict";

const WinstonLogger = require("../index.js");
const assert = require("chai").assert;
const sinon = require("sinon");

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

    it("set console transport", function() {
        var logger = new WinstonLogger(dummyComponentManager, "logger");
        logger.addTransport({
            type: "console",
            json: true
        });

        logger.info("foo");
    });
    it("set multiple transports");
    it("sets file transport");
    it("sets console transport");
});

describe("default logger messages", function() {
    var log;
    var stdoutSpy, stderrSpy;

    beforeEach(function() {
        log = new WinstonLogger(dummyComponentManager, "logger");
        log.addTransport({
            type: "console",
            json: true
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
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"error\",\n" +
            "  \"message\": \"something bad\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.args[0][0], msg);
        log.warn("will robinson");
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
    });

    it("error", function() {
        log.error("something bad");
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"error\",\n" +
            "  \"message\": \"something bad\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
        assert.strictEqual(stderrSpy.args[0][0], msg);
    });

    it("warn", function() {
        log.warn("will robinson");
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"warn\",\n" +
            "  \"message\": \"will robinson\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.args[0][0], msg);
    });

    it("info", function() {
        log.info("info test");
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"info\",\n" +
            "  \"message\": \"info test\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.args[0][0], msg);
    });

    it("verbose", function() {
        log.verbose("verbose test");
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"verbose\",\n" +
            "  \"message\": \"verbose test\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.args[0][0], msg);
    });

    it("debug", function() {
        log.debug("debug test");
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"debug\",\n" +
            "  \"message\": \"debug test\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.callCount, 0);
        assert.strictEqual(stderrSpy.args[0][0], msg);
    });

    it("silly", function() {
        log.config("set-level", "silly");
        log.silly("silly test");
        var msg =
            "{\n" +
            "  \"component\": \"logger\",\n" +
            "  \"level\": \"silly\",\n" +
            "  \"message\": \"silly test\"\n" +
            "}\n";
        assert.strictEqual(stderrSpy.callCount, 0);
        assert.strictEqual(stdoutSpy.callCount, 1);
        assert.strictEqual(stdoutSpy.args[0][0], msg);
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
});