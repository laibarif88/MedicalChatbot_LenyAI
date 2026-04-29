type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

/**
 * Logger service for centralized logging with environment-based levels
 */
class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  /**
   * Format log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  /**
   * Add log entry to history
   */
  private addToHistory(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Send error to external service (e.g., Sentry, LogRocket)
   */
  private sendToErrorService(entry: LogEntry) {
    // In production, send to error tracking service
    if (!this.isDevelopment && entry.level === 'error') {
      // TODO: Integrate with error tracking service
      // Example: Sentry.captureException(entry);
    }
  }

  /**
   * Debug level logging - only in development
   */
  debug(message: string, data?: any) {
    if (!this.isDevelopment) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      message,
      data
    };
    
    this.addToHistory(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data
    };
    
    this.addToHistory(entry);
    
    if (this.isDevelopment) {
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      data
    };
    
    this.addToHistory(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data: error,
      stack: error?.stack || new Error().stack
    };
    
    this.addToHistory(entry);

    
    // Send to error tracking service
    this.sendToErrorService(entry);
  }

  /**
   * Log a group of related messages
   */
  group(label: string, fn: () => void) {
    if (!this.isDevelopment) {
      fn();
      return;
    }
    
    console.group(label);
    fn();
    console.groupEnd();
  }

  /**
   * Log timing information
   */
  time(label: string) {
    if (!this.isDevelopment) return;
  }

  timeEnd(label: string) {
    if (!this.isDevelopment) return;
  }

  /**
   * Log a table of data
   */
  table(data: any) {
    if (!this.isDevelopment) return;
    console.table(data);
  }

  /**
   * Clear console (development only)
   */
  clear() {
    if (!this.isDevelopment) return;
    console.clear();
  }

  /**
   * Get log history
   */
  getHistory(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear log history
   */
  clearHistory() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as a file
   */
  downloadLogs() {
    const dataStr = this.exportLogs();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `logs-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton instance
export default logger;

// Also export the class for testing purposes
export { Logger };

// Convenience exports
export const { debug, info, warn, error, group, time, timeEnd, table, clear } = logger;
