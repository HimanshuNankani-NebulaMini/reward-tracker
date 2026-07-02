const isDev = typeof window !== 'undefined'
  ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  : (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');

/**
 * Utility logger object to safely route log prints in development environment,
 * preventing noisy console output in production builds.
 */
export const logger = {
  /**
   * Log an informational message.
   * @param {string} message - Main log description
   * @param {...*} args - Optional structured details/variables
   */
  info: (message, ...args) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  /**
   * Log a warning message.
   * @param {string} message - Main warning description
   * @param {...*} args - Optional structured details/variables
   */
  warn: (message, ...args) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  /**
   * Log an error message.
   * @param {string} message - Main error description
   * @param {...*} args - Optional structured details/variables
   */
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  }
};
