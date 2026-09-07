import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * User management routes — NOT YET IMPLEMENTED.
 * Requires authentication to be implemented first.
 */

const NOT_IMPLEMENTED = {
  success: false,
  message: 'User management is not yet implemented.',
  code: 'NOT_IMPLEMENTED',
};

router.get('/', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

router.get('/:id', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

router.patch('/:id', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

router.delete('/:id', (_req: Request, res: Response) => {
  res.status(501).json(NOT_IMPLEMENTED);
});

export default router;
