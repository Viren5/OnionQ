import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Inspection routes — NOT YET IMPLEMENTED.
 * Architecture is in place; CRUD operations will be added in a future step.
 */

const NOT_IMPLEMENTED = {
  success: false,
  message: 'Inspection management is not yet implemented.',
  code: 'NOT_IMPLEMENTED',
};

// List inspections
router.get('/', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Create inspection
router.post('/', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Get inspection by ID
router.get('/:id', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Update inspection
router.patch('/:id', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Cancel inspection
router.patch('/:id/cancel', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

// Upload images for an inspection
router.post('/:id/images', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

export default router;
