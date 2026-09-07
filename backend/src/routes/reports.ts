import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Report routes — NOT YET IMPLEMENTED.
 * Reports will be generated once analysis and grading are complete.
 * PDF generation and QR verification are planned for future phases.
 */

const NOT_IMPLEMENTED = {
  success: false,
  message: 'Report generation is not yet implemented.',
  code: 'NOT_IMPLEMENTED',
};

// Generate report for an inspection
router.post('/inspections/:inspectionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Get report for an inspection
router.get('/inspections/:inspectionId', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Download PDF report
router.get('/inspections/:inspectionId/pdf', (_req: Request, res: Response) => {
  res.status(501).json({
    ...NOT_IMPLEMENTED,
    message: 'PDF generation is not yet implemented.',
  });
});

// Verify report via QR token (public endpoint)
router.get('/verify/:token', (_req: Request, res: Response) => {
  res.status(501).json({
    ...NOT_IMPLEMENTED,
    message: 'QR-based report verification is not yet implemented.',
  });
});

export default router;
