import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';

const router = Router();

/**
 * GET /api/v1/health
 * Returns live service health status including DB connectivity.
 */
router.get('/', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  const health = {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: dbStatus,
    },
  };

  // Return 200 even if DB is disconnected — health endpoint itself is alive.
  // The consumer can inspect services.database to determine DB health.
  res.status(200).json(health);
});

export default router;
