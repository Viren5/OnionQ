import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Verification routes — NOT YET IMPLEMENTED.
 * Human verification of uncertain AI predictions will be available
 * once AI analysis is connected.
 */

const NOT_IMPLEMENTED = {
  success: false,
  message: 'Human verification workflow is not yet implemented.',
  code: 'NOT_IMPLEMENTED',
};

// List pending verifications
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Get pending verifications for an inspection
router.get('/inspections/:inspectionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Submit verification decision
router.post('/onions/:onionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

export default router;
