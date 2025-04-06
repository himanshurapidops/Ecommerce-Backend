import winston from "winston";
import fs from "fs";
import path from "path";

const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),

    new winston.transports.File({
      filename: path.join(logDir, "error.log"), 
      level: "error",
    }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);

export default logger;
