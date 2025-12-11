// Centralized logging system using Winston
// Winston is only imported on server-side to avoid browser bundling issues
let winston: any = null;

// Determine if we're in browser or server environment
const isBrowser = typeof window !== 'undefined';

// Only import winston on server-side
if (!isBrowser) {
  winston = require('winston');
}

// Custom format for colorized console output
const consoleFormat = !isBrowser && winston ? winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, module, ...meta }: any) => {
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
    return `${module || ''} [${timestamp}] ${level}: ${message} ${metaStr}`;
  })
) : null;

// JSON format for production
const jsonFormat = !isBrowser && winston ? winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
) : null;

// Create base logger
const logger = isBrowser
  ? createBrowserLogger()
  : createServerLogger();

// Browser logger (simple console wrapper)
function createBrowserLogger() {
  return {
    info: (meta: any, msg?: string) => {
      const message = typeof meta === 'string' ? meta : msg || '';
      const data = typeof meta === 'object' ? meta : {};
      console.log(`ℹ️ ${message}`, data);
    },
    error: (meta: any, msg?: string) => {
      const message = typeof meta === 'string' ? meta : msg || '';
      const data = typeof meta === 'object' ? meta : {};
      console.error(`❌ ${message}`, data);
    },
    warn: (meta: any, msg?: string) => {
      const message = typeof meta === 'string' ? meta : msg || '';
      const data = typeof meta === 'object' ? meta : {};
      console.warn(`⚠️ ${message}`, data);
    },
    debug: (meta: any, msg?: string) => {
      const message = typeof meta === 'string' ? meta : msg || '';
      const data = typeof meta === 'object' ? meta : {};
      console.debug(`🔍 ${message}`, data);
    },
    child: (options: any) => createBrowserLogger(),
  };
}

// Server logger (Winston)
function createServerLogger() {
  if (!winston) {
    // Fallback to console if winston is not available
    return createBrowserLogger();
  }
  
  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    transports: [
      new winston.transports.Console({
        stderrLevels: ['error'],
      }),
    ],
  });
}

// Create module-specific child loggers with emoji identifiers
export const diceLogger = isBrowser 
  ? { 
      ...createBrowserLogger(),
      info: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.log(`🎲 Dice [INFO]`, message, data);
      },
      debug: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.debug(`🎲 Dice [DEBUG]`, message, data);
      },
      error: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.error(`🎲 Dice [ERROR]`, message, data);
      },
      warn: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.warn(`🎲 Dice [WARN]`, message, data);
      },
    }
  : logger.child({ module: '🎲 Dice' });

export const aiLogger = isBrowser
  ? {
      ...createBrowserLogger(),
      info: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.log(`🤖 AI [INFO]`, message, data);
      },
      debug: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.debug(`🤖 AI [DEBUG]`, message, data);
      },
      error: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.error(`🤖 AI [ERROR]`, message, data);
      },
      warn: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.warn(`🤖 AI [WARN]`, message, data);
      },
    }
  : logger.child({ module: '🤖 AI' });

export const storageLogger = isBrowser
  ? {
      ...createBrowserLogger(),
      info: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.log(`💾 Storage [INFO]`, message, data);
      },
      debug: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.debug(`💾 Storage [DEBUG]`, message, data);
      },
      error: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.error(`💾 Storage [ERROR]`, message, data);
      },
      warn: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.warn(`💾 Storage [WARN]`, message, data);
      },
    }
  : logger.child({ module: '💾 Storage' });

export const gameLogger = isBrowser
  ? {
      ...createBrowserLogger(),
      info: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.log(`🎮 Game [INFO]`, message, data);
      },
      debug: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.debug(`🎮 Game [DEBUG]`, message, data);
      },
      error: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.error(`🎮 Game [ERROR]`, message, data);
      },
      warn: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.warn(`🎮 Game [WARN]`, message, data);
      },
    }
  : logger.child({ module: '🎮 Game' });

export const apiLogger = isBrowser
  ? {
      ...createBrowserLogger(),
      info: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.log(`🌐 API [INFO]`, message, data);
      },
      debug: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.debug(`🌐 API [DEBUG]`, message, data);
      },
      error: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.error(`🌐 API [ERROR]`, message, data);
      },
      warn: (meta: any, msg?: string) => {
        const message = typeof meta === 'string' ? meta : msg || '';
        const data = typeof meta === 'object' ? meta : {};
        console.warn(`🌐 API [WARN]`, message, data);
      },
    }
  : logger.child({ module: '🌐 API' });

// Helper function to log performance
export function logPerformance(logger: any, operation: string, startTime: number) {
  const duration = Date.now() - startTime;
  logger.info({ duration: `${duration}ms` }, `${operation} completed`);
}

// Helper to sanitize sensitive data
export function sanitize(data: any): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  
  // Remove API keys and sensitive fields
  const sensitiveFields = ['apiKey', 'api_key', 'password', 'token', 'secret'];
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

export default logger;
