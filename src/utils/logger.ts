/**
 * Production-ready logging service
 * - Only logs in development mode
 * - Silently handles errors in production
 * - Provides structured logging for debugging
 */

declare const __DEV__: boolean;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  component?: string;
  action?: string;
}

class Logger {
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep only last 100 logs in memory

  constructor() {
    this.isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      component: context
    };
  }

  private addToMemory(entry: LogEntry) {
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
    this.logs.push(entry);
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const emoji = {
      log: '📝',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    };
    
    const prefix = context ? `${emoji[level]} [${context}]` : emoji[level];
    return `${prefix} ${message}`;
  }

  log(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('log', message, data, context);
    this.addToMemory(entry);
  }

  info(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('info', message, data, context);
    this.addToMemory(entry);
  }

  warn(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('warn', message, data, context);
    this.addToMemory(entry);
  }

  error(message: string, error?: any, context?: string) {
    const entry = this.createLogEntry('error', message, error, context);
    this.addToMemory(entry);
  }

  debug(message: string, data?: any, context?: string) {
    const entry = this.createLogEntry('debug', message, data, context);
    this.addToMemory(entry);
  }

  // Get recent logs for debugging (only in development)
  getRecentLogs(count = 20): LogEntry[] {
    if (!this.isDevelopment) {
      return [];
    }
    return this.logs.slice(-count);
  }

  // Clear logs from memory
  clearLogs() {
    this.logs = [];
  }

  // For production error reporting (silent)
  reportError(error: Error, context?: string, additionalData?: any) {
    const entry = this.createLogEntry('error', error.message, {
      name: error.name,
      stack: error.stack,
      additionalData
    }, context);
    
    this.addToMemory(entry);
    
    // In production, you might want to send this to a crash reporting service
    // like Sentry, Crashlytics, etc.
    // For now, we'll just store it silently
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience methods for common use cases
export const logNavigation = (screen: string, action: string, data?: any) => {
  logger.debug(`Navigation: ${action}`, data, screen);
};

export const logApiCall = (endpoint: string, method: string, data?: any) => {
  logger.debug(`API ${method}: ${endpoint}`, data, 'API');
};

export const logUserAction = (action: string, data?: any, screen?: string) => {
  logger.info(`User Action: ${action}`, data, screen);
};

export const logError = (error: Error | string, context?: string, data?: any) => {
  if (typeof error === 'string') {
    logger.error(error, data, context);
  } else {
    logger.reportError(error, context, data);
  }
};
