import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

/**
 * Auth routes — NOT YET IMPLEMENTED.
 * Real JWT authentication will be added in a future development phase.
 */

router.post('/register', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'User registration is not yet implemented.',
    code: 'NOT_IMPLEMENTED',
  });
});

router.post('/login', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Authentication is not yet implemented.',
    code: 'NOT_IMPLEMENTED',
  });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Logout is not yet implemented.',
    code: 'NOT_IMPLEMENTED',
  });
});

router.get('/me', (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Profile retrieval is not yet implemented.',
    code: 'NOT_IMPLEMENTED',
  });
});

export default router;
