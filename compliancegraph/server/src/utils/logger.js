/**
 * Structured Logging Module
 * Provides consistent logging across the application
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

class Logger {
  constructor(module) {
    this.module = module;
    this.logFile = path.join(logsDir, 'app.log');
  }

  _format(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      ...data,
      pid: process.pid,
    };
  }

  _write(level, message, data) {
    const entry = this._format(level, message, data);
    const logLine = JSON.stringify(entry);

    // Console output
    const prefix = `[${entry.timestamp}] [${level}] [${this.module}]`;
    console.log(`${prefix} ${message}`, data);

    // File output (if enabled)
    if (process.env.LOG_LEVEL !== 'silent') {
      try {
        fs.appendFileSync(this.logFile, logLine + '\n');
      } catch (e) {
        console.error('Failed to write to log file:', e.message);
      }
    }
  }

  error(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      this._write('ERROR', message, data);
    }
  }

  warn(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      this._write('WARN', message, data);
    }
  }

  info(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      this._write('INFO', message, data);
    }
  }

  debug(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      this._write('DEBUG', message, data);
    }
  }
}

module.exports = (module) => new Logger(module);
