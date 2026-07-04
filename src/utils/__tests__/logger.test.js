/**
 * @jest-environment node
 */

describe("logger", () => {
  let originalWindow;
  let originalProcess;
  let originalNodeEnv;

  let consoleInfoSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeAll(() => {
    originalWindow = global.window;
    originalProcess = global.process;
    originalNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    global.window = originalWindow;
    global.process = originalProcess;
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Restore globals
    global.window = originalWindow;
    global.process = originalProcess;
    process.env.NODE_ENV = originalNodeEnv;
  });

  function loadLogger() {
    let loggerModule;
    jest.isolateModules(() => {
      loggerModule = require("../logger");
    });
    return loggerModule.logger;
  }

  test("should enable dev logging when window is defined and hostname is localhost", () => {
    global.window = {
      location: {
        hostname: "localhost",
      },
    };

    const logger = loadLogger();
    logger.info("info message", "arg1");
    logger.warn("warn message", "arg2");
    logger.error("error message", "arg3");

    expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] info message", "arg1");
    expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] warn message", "arg2");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ERROR] error message",
      "arg3",
    );
  });

  test("should enable dev logging when window is defined and hostname is 127.0.0.1", () => {
    global.window = {
      location: {
        hostname: "127.0.0.1",
      },
    };

    const logger = loadLogger();
    logger.info("info message");
    logger.warn("warn message");

    expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] info message");
    expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] warn message");
  });

  test("should disable info/warn logging when window is defined but hostname is not localhost or 127.0.0.1", () => {
    global.window = {
      location: {
        hostname: "example.com",
      },
    };

    const logger = loadLogger();
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] error message");
  });

  test("should enable dev logging when window is undefined and NODE_ENV is development", () => {
    global.window = undefined;
    process.env.NODE_ENV = "development";

    const logger = loadLogger();
    logger.info("info message");
    logger.warn("warn message");

    expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO] info message");
    expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN] warn message");
  });

  test("should disable info/warn logging when window is undefined and NODE_ENV is production", () => {
    global.window = undefined;
    process.env.NODE_ENV = "production";

    const logger = loadLogger();
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] error message");
  });

  test("should disable info/warn logging when window is undefined and process is undefined", () => {
    global.window = undefined;
    global.process = undefined;

    const logger = loadLogger();
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(consoleInfoSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR] error message");
  });
});
