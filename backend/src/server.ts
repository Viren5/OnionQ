import { validateEnv, config } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import app from './app';

// Validate environment variables before anything else
validateEnv();

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express
    const server = app.listen(config.port, () => {
      logger.info(`[Server] OnionQ API running on port ${config.port}`);
      logger.info(`[Server] Environment: ${config.env}`);
      logger.info(`[Server] Health endpoint: http://localhost:${config.port}/api/v1/health`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        logger.info('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    const err = error as Error;
    logger.error(`[Server] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

startServer();
