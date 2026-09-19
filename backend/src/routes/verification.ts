import { Router } from 'express';
import type { Request, Response } from 'express';
import { OnionAnalysis, type OnionClassification } from '../models/OnionAnalysis';
import { Verification, type VerificationDecision } from '../models/Verification';
import { Inspection } from '../models/Inspection';
import { getOrCreateDefaultInspector } from '../utils/defaultUser';

const router = Router();

// List all pending detections requiring human verification
router.get('/', async (_req: Request, res: Response) => {
  try {
    const pending = await OnionAnalysis.find({ verificationStatus: 'pending' })
      .populate('inspectionId', 'batchInfo status createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: pending,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch verification queue: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Get pending verifications for an inspection
router.get('/inspections/:inspectionId', async (req: Request, res: Response) => {
  try {
    const { inspectionId } = req.params;
    const pending = await OnionAnalysis.find({
      inspectionId,
      verificationStatus: 'pending',
    }).sort({ onionSequenceId: 1 });

    res.json({
      success: true,
      data: pending,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch pending detections: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Submit a human verification decision for an individual onion
router.post('/onions/:onionId', async (req: Request, res: Response) => {
  try {
    const { decision, inspectorClassification, reason } = req.body as {
      decision: VerificationDecision;
      inspectorClassification?: OnionClassification;
      reason?: string;
    };

    if (!decision || (decision !== 'confirm_ai' && decision !== 'override')) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision. Must be 'confirm_ai' or 'override'.",
        code: 'VALIDATION_ERROR',
      });
    }

    const onion = await OnionAnalysis.findById(req.params.onionId);
    if (!onion) {
      return res.status(404).json({
        success: false,
        message: `Onion detection not found with ID: ${req.params.onionId}`,
        code: 'NOT_FOUND',
      });
    }

    // Update OnionAnalysis document
    onion.verificationStatus = decision === 'confirm_ai' ? 'verified' : 'overridden';
    if (decision === 'override' && inspectorClassification) {
      onion.classification = inspectorClassification;
    }
    await onion.save();

    // Record audit verification
    const inspector = await getOrCreateDefaultInspector();
    const verification = await Verification.create({
      onionAnalysisId: onion._id,
      inspectionId: onion.inspectionId,
      inspectorId: inspector._id,
      decision,
      inspectorClassification,
      reason,
    });

    // If no more pending onions remain for this inspection, update inspection status
    const pendingRemaining = await OnionAnalysis.countDocuments({
      inspectionId: onion.inspectionId,
      verificationStatus: 'pending',
    });

    if (pendingRemaining === 0) {
      await Inspection.findByIdAndUpdate(onion.inspectionId, {
        status: 'verification_complete',
      });
    }

    res.json({
      success: true,
      message: 'Human verification decision recorded successfully',
      data: verification,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to record verification: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

export default router;
