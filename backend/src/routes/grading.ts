import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Grading routes — NOT YET IMPLEMENTED.
 * Grading rules (e.g. AGMARK standards) must be formally defined
 * before any grading engine is implemented.
 * No invented grading rules or thresholds are used.
 */

const NOT_IMPLEMENTED = {
  success: false,
  message: 'Grading engine is not yet implemented. Official grading standards (e.g. AGMARK) must be formally configured before grading can be performed.',
  code: 'NOT_IMPLEMENTED',
};

// Get grading configuration
router.get('/config', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Grade an inspection
router.post('/inspections/:inspectionId/grade', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Get grading result for an inspection
router.get('/inspections/:inspectionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

export default router;
