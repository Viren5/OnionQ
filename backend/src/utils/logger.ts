import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp: ts }) => `${ts} [${level}] ${message}`)
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
  level: config.logLevel,
  format: config.env === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});
