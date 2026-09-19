import { Router } from 'express';
import type { Request, Response } from 'express';
import { User } from '../models/User';
import { getOrCreateDefaultInspector } from '../utils/defaultUser';

const router = Router();

// Get active current user (Inspector)
router.get('/me', async (_req: Request, res: Response) => {
  try {
    const user = await getOrCreateDefaultInspector();
    res.json({
      success: true,
      data: user,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to load user profile: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Real login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let user = null;

    if (email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await getOrCreateDefaultInspector();
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token: `onionq_session_${user._id.toString()}`,
        user,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Login failed: ${err.message}`,
      code: 'AUTH_ERROR',
    });
  }
});

// Logout endpoint
router.post('/logout', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

export default router;
