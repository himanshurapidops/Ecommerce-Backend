const winston = require("winston");

// Create a Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Logs to console
    new winston.transports.File({ filename: "app.log" }), // Logs to a file
  ],
});
