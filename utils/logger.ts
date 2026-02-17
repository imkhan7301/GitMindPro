/**
 * Application logging utility
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  error?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isDevelopment = import.meta.env.DEV;

  log(level: LogLevel, message: string, data?: unknown, error?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Send to analytics in production
    if (!this.isDevelopment && level >= LogLevel.WARN) {
      this.reportToAnalytics(entry);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: unknown): void {
    this.log(LogLevel.ERROR, message, undefined, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    return level !== undefined ? this.logs.filter(l => l.level >= level) : this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  private reportToAnalytics(entry: LogEntry): void {
    // Implement analytics reporting here
    // Example: send to Google Analytics, Sentry, etc.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: `${entry.message}`,
        fatal: entry.level === LogLevel.ERROR,
      });
    }
  }
}

export const logger = new Logger();
