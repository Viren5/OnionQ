import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Placeholder middleware for JWT authentication.
 * Authentication is NOT yet implemented.
 * This will be replaced with real JWT verification in a future step.
 */
export function authenticate(_req: Request, res: Response, _next: NextFunction): void {
  res.status(501).json({
    success: false,
    error: {
      message: 'Authentication is not yet implemented.',
      code: 'AUTH_NOT_IMPLEMENTED',
    },
  });
  logger.warn('[Auth] authenticate() called but authentication is not implemented.');
}

/**
 * Placeholder middleware for role-based authorization.
 * Will be implemented once real authentication is in place.
 */
export function authorize(
  ..._roles: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(501).json({
      success: false,
      error: {
        message: 'Authorization is not yet implemented.',
        code: 'AUTHZ_NOT_IMPLEMENTED',
      },
    });
    logger.warn('[Auth] authorize() called but authorization is not implemented.');
  };
}
