import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * AI Analysis routes — NOT YET IMPLEMENTED.
 * Will be connected to the AI service (FastAPI + YOLO) in a future step.
 * No fake analysis results are returned.
 */

const NOT_IMPLEMENTED = {
  success: false,
  message: 'AI analysis is not yet implemented. The AI service (YOLO inference) will be connected in a future development phase.',
  code: 'NOT_IMPLEMENTED',
};

// Trigger analysis for an inspection
router.post('/inspections/:inspectionId/analyze', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Get analysis results for an inspection
router.get('/inspections/:inspectionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Get individual onion analysis
router.get('/onions/:onionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

export default router;
