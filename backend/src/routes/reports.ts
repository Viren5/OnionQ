import { Router } from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Inspection } from '../models/Inspection';
import { OnionAnalysis } from '../models/OnionAnalysis';
import { Report, type IDistributionEntry, type FinalGrade } from '../models/Report';
import { getOrCreateDefaultInspector } from '../utils/defaultUser';

const router = Router();

// Generate official report for an inspection based on real detections
router.post('/inspections/:inspectionId', async (req: Request, res: Response) => {
  try {
    const { inspectionId } = req.params;
    const inspection = await Inspection.findById(inspectionId);

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: `Inspection batch not found with ID: ${inspectionId}`,
        code: 'NOT_FOUND',
      });
    }

    const detections = await OnionAnalysis.find({ inspectionId });
    if (!detections || detections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate quality report: No AI detections found for this inspection batch.',
        code: 'NO_ANALYSIS_DATA',
      });
    }

    const totalDetected = detections.length;
    const totalVerified = detections.filter(
      (d) => d.verificationStatus === 'verified' || d.verificationStatus === 'overridden'
    ).length;

    // 1. Condition/Classification Distribution from actual detections
    const classCountMap: Record<string, number> = {};
    detections.forEach((d) => {
      const cls = d.classification || 'unclassified';
      classCountMap[cls] = (classCountMap[cls] || 0) + 1;
    });

    const classificationDistribution: IDistributionEntry[] = Object.entries(classCountMap).map(
      ([cls, count]) => {
        let label = 'Unclassified';
        if (cls === 'grade_a') label = 'Healthy / Prime Commercial';
        else if (cls === 'urs') label = 'Under-Sized / Secondary';
        else if (cls === 'rejected') label = 'Defective / Rejections';

        return {
          label,
          count,
          percentage: Math.round((count / totalDetected) * 1000) / 10,
        };
      }
    );

    // 2. Defect Incidence Distribution from actual model predictions
    const defectCountMap: Record<string, number> = {};
    detections.forEach((d) => {
      if (!d.detectedDefects || d.detectedDefects.length === 0 || d.detectedDefects.includes('none')) {
        defectCountMap['Clean / No Defect'] = (defectCountMap['Clean / No Defect'] || 0) + 1;
      } else {
        d.detectedDefects.forEach((def) => {
          const formatted = def.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          defectCountMap[formatted] = (defectCountMap[formatted] || 0) + 1;
        });
      }
    });

    const defectDistribution: IDistributionEntry[] = Object.entries(defectCountMap).map(
      ([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / totalDetected) * 1000) / 10,
      })
    );

    // 3. Size Category Distribution (if estimated, else clean distribution)
    const sizeCountMap: Record<string, number> = {
      Standard: totalDetected,
    };
    const sizeDistribution: IDistributionEntry[] = [
      {
        label: 'Sampled Batch Size',
        count: totalDetected,
        percentage: 100,
      },
    ];

    // 4. Average AI Confidence
    const totalConfidence = detections.reduce((sum, d) => sum + (d.detectionConfidence || 0), 0);
    const averageAiConfidence = Math.round((totalConfidence / totalDetected) * 1000) / 1000;

    // 5. Final Grade: Do NOT invent unsupported thresholds; mark as not_graded / pending official verification
    const finalGrade: FinalGrade = 'not_graded';

    const inspector = await getOrCreateDefaultInspector();

    // Create or update Report document in MongoDB
    const reportData = {
      inspectionId: inspection._id,
      generatedByInspectorId: inspector._id,
      summary: {
        totalOnionsDetected: totalDetected,
        totalOnionsVerified: totalVerified,
        classificationDistribution,
        defectDistribution,
        sizeDistribution,
        finalGrade,
        averageAiConfidence,
        gradingRuleSnapshot: {
          standardId: 'PENDING_VERIFICATION',
          standardName: 'Official Agmark Rule Standard (Pending Verification)',
          ruleVersion: '1.0.0',
        },
      },
      qrVerificationToken: `oq-cert-${uuidv4().substring(0, 8)}`,
    };

    const report = await Report.findOneAndUpdate(
      { inspectionId: inspection._id },
      reportData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('generatedByInspectorId', 'name email role');

    // Update inspection status
    inspection.status = 'report_generated';
    await inspection.save();

    res.json({
      success: true,
      message: 'Quality assessment report compiled successfully',
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to generate report: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Get report for an inspection
router.get('/inspections/:inspectionId', async (req: Request, res: Response) => {
  try {
    const report = await Report.findOne({ inspectionId: req.params.inspectionId }).populate(
      'generatedByInspectorId',
      'name email role'
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Report not found for inspection ID: ${req.params.inspectionId}`,
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to retrieve report: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

// Verify report via public QR token
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const report = await Report.findOne({ qrVerificationToken: req.params.token }).populate(
      'generatedByInspectorId',
      'name email role'
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Certificate not found for verification token: ${req.params.token}`,
        code: 'NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Failed to verify report token: ${err.message}`,
      code: 'DB_ERROR',
    });
  }
});

export default router;
