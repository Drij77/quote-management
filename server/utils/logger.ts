import winston from 'winston';
import { config } from '../config/config';

const { format } = winston;
const { combine, timestamp, json, printf } = format;

const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp(),
    config.isDevelopment ? customFormat : json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      format: json()
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      format: json()
    }),
    new winston.transports.Console({
      format: config.isDevelopment ? customFormat : json()
    })
  ]
});

// Create a type for the logger methods
export type Logger = typeof logger; 