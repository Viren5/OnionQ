import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { Types } from 'mongoose';

import { Inspection } from '../models/Inspection';
import { OnionAnalysis } from '../models/OnionAnalysis';
import { config } from '../config/env';

const router = Router();

/**
 * POST /api/v1/analysis/inspections/:inspectionId/analyze
 *
 * Sends the inspection's real uploaded image to the FastAPI AI service,
 * receives real YOLO detections, and stores them in MongoDB.
 */
router.post(
  '/inspections/:inspectionId/analyze',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inspectionId } = req.params;

      // Validate MongoDB ObjectId
      if (!Types.ObjectId.isValid(inspectionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid inspection ID',
        });
      }

      // 1. Find the real inspection
      const inspection = await Inspection.findById(inspectionId);

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspection not found',
        });
      }

      // 2. Make sure an image actually exists
      if (!inspection.imageReferences.length) {
        return res.status(400).json({
          success: false,
          message: 'No image has been uploaded for this inspection',
        });
      }

      const imageReference = inspection.imageReferences[0];

let imagePath: string;

try {
  const imageUrl = new URL(imageReference);

  if (imageUrl.pathname.startsWith('/uploads/')) {
    const filename = path.basename(imageUrl.pathname);
    imagePath = path.join(path.resolve(config.uploadDir), filename);
  } else {
    return res.status(400).json({
      success: false,
      message: `Unsupported inspection image URL: ${imageReference}`,
    });
  }
} catch {
  // Support a local filesystem path as well
  imagePath = path.isAbsolute(imageReference)
    ? imageReference
    : path.resolve(process.cwd(), imageReference);
}

try {
  await fs.access(imagePath);
} catch {
  return res.status(404).json({
    success: false,
    message: `Inspection image file not found: ${imagePath}`,
  });
}

      // 5. Mark analysis as in progress
      inspection.status = 'analysis_in_progress';
      await inspection.save();

      // 6. Read the actual image
      const imageBuffer = await fs.readFile(imagePath);

      // 7. Build multipart request for FastAPI
      const form = new FormData();

      form.append('file', imageBuffer, {
        filename: path.basename(imagePath),
      });

      // 8. Call the REAL FastAPI AI service
      const aiResponse = await axios.post(
        `${config.aiServiceUrl}/api/v1/analyze`,
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000,
        }
      );

      const aiResult = aiResponse.data;

      if (!aiResult?.success) {
        throw new Error('AI service returned an unsuccessful response');
      }

      // 9. Remove previous analysis for this inspection
      //    This prevents duplicate onion records when analysis is run again.
      await OnionAnalysis.deleteMany({
        inspectionId: inspection._id,
      });

      const imageWidth = aiResult.image.width;
      const imageHeight = aiResult.image.height;

      // 10. Convert REAL YOLO detections into OnionAnalysis documents
      const analyses = aiResult.detections.map((detection: any, index: number) => {
        const { x1, y1, x2, y2 } = detection.bounding_box;

        // Convert YOLO pixel coordinates to percentages.
        const x = (x1 / imageWidth) * 100;
        const y = (y1 / imageHeight) * 100;
        const width = ((x2 - x1) / imageWidth) * 100;
        const height = ((y2 - y1) / imageHeight) * 100;

        let detectedDefects: string[];

        switch (detection.class_name) {
          case 'healthy':
            detectedDefects = ['none'];
            break;

          case 'mold':
            detectedDefects = ['disease'];
            break;

          case 'rotten':
            detectedDefects = ['rotting'];
            break;

          case 'sprouted':
            detectedDefects = ['sprouting'];
            break;

          default:
            detectedDefects = ['other'];
        }

        return {
          inspectionId: inspection._id,
          onionSequenceId: `ONI-${String(index + 1).padStart(3, '0')}`,
          sourceImageReference: imageReference,

          boundingBox: {
            x,
            y,
            width,
            height,
          },

          detectionConfidence: detection.confidence,

          detectedDefects,

          // The YOLO model does NOT determine official grades.
          classification: 'unclassified',

          verificationStatus:
            detection.confidence < 0.5 ? 'pending' : 'not_required',
        };
      });

      // 11. Save real analysis results to MongoDB
      const savedAnalyses =
        analyses.length > 0
          ? await OnionAnalysis.insertMany(analyses)
          : [];

      // 12. Update inspection status
      inspection.status =
        savedAnalyses.length > 0
          ? 'analysis_complete'
          : 'analysis_complete';

      await inspection.save();

      // 13. Return actual AI results
      return res.status(200).json({
        success: true,
        message: 'AI analysis completed successfully',
        data: {
          inspectionId: inspection._id,
          detectionCount: savedAnalyses.length,
          inferenceTimeMs: aiResult.inference_time_ms,
          modelInfo: aiResult.model_info,
          detections: savedAnalyses,
        },
      });
    } catch (error) {
      // If AI or another dependency fails, mark the inspection appropriately.
      if (
        req.params.inspectionId &&
        Types.ObjectId.isValid(req.params.inspectionId)
      ) {
        try {
          await Inspection.findByIdAndUpdate(req.params.inspectionId, {
            status: 'analysis_pending',
          });
        } catch {
          // Preserve original error.
        }
      }

      if (axios.isAxiosError(error)) {
        console.error(
          'AI service request failed:',
          error.response?.data || error.message
        );

        return res.status(503).json({
          success: false,
          message: 'AI service unavailable',
          details: error.response?.data?.detail || error.message,
        });
      }

      next(error);
    }
  }
);


/**
 * GET /api/v1/analysis/inspections/:inspectionId
 *
 * Returns real stored onion analyses from MongoDB.
 */
router.get(
  '/inspections/:inspectionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inspectionId } = req.params;

      if (!Types.ObjectId.isValid(inspectionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid inspection ID',
        });
      }

      const analyses = await OnionAnalysis.find({
        inspectionId,
      }).sort({ onionSequenceId: 1 });

      return res.status(200).json({
        success: true,
        data: analyses,
      });
    } catch (error) {
      next(error);
    }
  }
);


/**
 * GET /api/v1/analysis/onions/:onionId
 *
 * Returns one real onion analysis from MongoDB.
 */
router.get(
  '/onions/:onionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { onionId } = req.params;

      if (!Types.ObjectId.isValid(onionId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid onion ID',
        });
      }

      const onion = await OnionAnalysis.findById(onionId);

      if (!onion) {
        return res.status(404).json({
          success: false,
          message: 'Onion analysis not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: onion,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;