import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

const RECONNECT_INTERVAL_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 5;

let reconnectAttempts = 0;

export async function connectDatabase(): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    mongoose.connection.on('connected', () => {
      logger.info('[Database] MongoDB connected successfully');
      reconnectAttempts = 0;
    });

    mongoose.connection.on('error', (err: Error) => {
      logger.error(`[Database] MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[Database] MongoDB disconnected');

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        logger.info(
          `[Database] Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${RECONNECT_INTERVAL_MS / 1000}s...`
        );
        setTimeout(() => {
          connectDatabase().catch((err: Error) => {
            logger.error(`[Database] Reconnect failed: ${err.message}`);
          });
        }, RECONNECT_INTERVAL_MS);
      } else {
        logger.error(
          '[Database] Max reconnection attempts reached. Please check your MongoDB connection.'
        );
      }
    });

    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`[Database] Initial connection failed: ${err.message}`);
    throw error;
  }
}

export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' | 'error' {
  const stateMap: Record<number, 'connected' | 'disconnected' | 'connecting' | 'error'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected', // disconnecting
    99: 'error',
  };
  return stateMap[mongoose.connection.readyState] ?? 'error';
}
