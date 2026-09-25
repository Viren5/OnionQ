import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { Types } from "mongoose";

import { Inspection } from "../models/Inspection";
import { OnionAnalysis } from "../models/OnionAnalysis";
import { config } from "../config/env";

const router = Router();

/**
 * POST /api/v1/analysis/inspections/:inspectionId/analyze
 *
 * Sends the inspection's real uploaded image to the FastAPI AI service,
 * receives real YOLO detections, converts them into OnionQ classifications,
 * and stores them in MongoDB.
 *
 * AI -> OnionQ mapping:
 *
 * healthy  -> grade_a
 * mold     -> rejected
 * rotten   -> rejected
 * sprouted -> rejected
 * unknown  -> unclassified
 */
router.post(
  "/inspections/:inspectionId/analyze",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inspectionId } = req.params;

      // ============================================================
      // 1. VALIDATE MONGODB OBJECT ID
      // ============================================================

      if (!Types.ObjectId.isValid(inspectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inspection ID",
        });
      }

      // ============================================================
      // 2. FIND THE REAL INSPECTION
      // ============================================================

      const inspection = await Inspection.findById(inspectionId);

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: "Inspection not found",
        });
      }

      // ============================================================
      // 3. MAKE SURE AN IMAGE EXISTS
      // ============================================================

      if (!inspection.imageReferences.length) {
        return res.status(400).json({
          success: false,
          message: "No image has been uploaded for this inspection",
        });
      }

      const imageReference = inspection.imageReferences[0];

      // ============================================================
      // 4. RESOLVE IMAGE PATH
      // ============================================================

      let imagePath: string;

      try {
        const imageUrl = new URL(imageReference);

        if (imageUrl.pathname.startsWith("/uploads/")) {
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

      // ============================================================
      // 5. CHECK IMAGE FILE EXISTS
      // ============================================================

      try {
        await fs.access(imagePath);
      } catch {
        return res.status(404).json({
          success: false,
          message: `Inspection image file not found: ${imagePath}`,
        });
      }

      // ============================================================
      // 6. MARK ANALYSIS AS IN PROGRESS
      // ============================================================

      inspection.status = "analysis_in_progress";

      await inspection.save();

      // ============================================================
      // 7. READ THE ACTUAL IMAGE
      // ============================================================

      const imageBuffer = await fs.readFile(imagePath);

      // ============================================================
      // 8. BUILD MULTIPART REQUEST FOR FASTAPI
      // ============================================================

      const form = new FormData();

      form.append("file", imageBuffer, {
        filename: path.basename(imagePath),
      });

      // ============================================================
      // 9. CALL THE REAL FASTAPI AI SERVICE
      // ============================================================

      const aiResponse = await axios.post(
        `${config.aiServiceUrl}/api/v1/analyze`,
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 120000,
        },
      );

      const aiResult = aiResponse.data;

      if (!aiResult?.success) {
        throw new Error("AI service returned an unsuccessful response");
      }

      // ============================================================
      // 10. REMOVE PREVIOUS ANALYSIS
      // ============================================================
      //
      // This prevents duplicate onion records when analysis
      // is run again for the same inspection.
      // ============================================================

      await OnionAnalysis.deleteMany({
        inspectionId: inspection._id,
      });

      const imageWidth = aiResult.image.width;
      const imageHeight = aiResult.image.height;

      // ============================================================
      // 11. CONVERT REAL YOLO DETECTIONS
      //     INTO ONIONQ ANALYSIS DOCUMENTS
      // ============================================================

      const analyses = aiResult.detections.map(
        (detection: any, index: number) => {
          const { x1, y1, x2, y2 } = detection.bounding_box;

          // --------------------------------------------------------
          // Convert YOLO pixel coordinates to percentages
          // --------------------------------------------------------

          const x = (x1 / imageWidth) * 100;

          const y = (y1 / imageHeight) * 100;

          const width = ((x2 - x1) / imageWidth) * 100;

          const height = ((y2 - y1) / imageHeight) * 100;

          // --------------------------------------------------------
          // AI CLASSIFICATION
          // --------------------------------------------------------
          //
          // The YOLO model returns:
          //
          // healthy
          // mold
          // rotten
          // sprouted
          //
          // Convert those into OnionQ classifications.
          // --------------------------------------------------------

          let classification: "grade_a" | "urs" | "rejected" | "unclassified";

          let detectedDefects: string[];

          switch (String(detection.class_name).toLowerCase().trim()) {
            // ======================================================
            // HEALTHY
            // ======================================================
            //
            // Healthy onion becomes Grade A.
            // No defect.
            // ======================================================

            case "healthy":
              classification = "grade_a";

              detectedDefects = ["none"];

              break;

            // ======================================================
            // MOLD
            // ======================================================
            //
            // Moldy onion becomes rejected.
            // ======================================================

            case "mold":
              classification = "rejected";

              detectedDefects = ["disease"];

              break;

            // ======================================================
            // ROTTEN
            // ======================================================
            //
            // Rotten onion becomes rejected.
            // ======================================================

            case "rotten":
              classification = "rejected";

              detectedDefects = ["rotting"];

              break;

            // ======================================================
            // SPROUTED
            // ======================================================
            //
            // Sprouted onion becomes rejected.
            // ======================================================

            case "sprouted":
              classification = "rejected";

              detectedDefects = ["sprouting"];

              break;

            // ======================================================
            // UNKNOWN AI CLASS
            // ======================================================
            //
            // If the model returns something unexpected,
            // keep it unclassified instead of guessing.
            // ======================================================

            default:
              classification = "unclassified";

              detectedDefects = ["other"];

              break;
          }

          // --------------------------------------------------------
          // VERIFICATION STATUS
          // --------------------------------------------------------
          //
          // Low-confidence detections still require human
          // verification.
          //
          // High-confidence detections do not require verification.
          // --------------------------------------------------------

          const verificationStatus =
            detection.confidence < 0.5 ? "pending" : "not_required";

          // --------------------------------------------------------
          // DEBUG LOG
          // --------------------------------------------------------
          //
          // This will help us see exactly what the AI detected
          // and what OnionQ stored.
          // --------------------------------------------------------

          console.log(
            `Onion ${index + 1}: AI=${detection.class_name}, ` +
              `confidence=${detection.confidence}, ` +
              `classification=${classification}, ` +
              `defects=${detectedDefects.join(", ")}`,
          );

          // --------------------------------------------------------
          // RETURN MONGODB DOCUMENT
          // --------------------------------------------------------

          return {
            inspectionId: inspection._id,

            onionSequenceId: `ONI-${String(index + 1).padStart(3, "0")}`,

            sourceImageReference: imageReference,

            boundingBox: {
              x,
              y,
              width,
              height,
            },

            detectionConfidence: detection.confidence,

            detectedDefects,

            // IMPORTANT:
            // Save the real OnionQ classification.
            classification,

            verificationStatus,
          };
        },
      );

      // ============================================================
      // 12. SAVE REAL ANALYSIS RESULTS TO MONGODB
      // ============================================================

      const savedAnalyses =
        analyses.length > 0 ? await OnionAnalysis.insertMany(analyses) : [];

      // ============================================================
      // 13. UPDATE INSPECTION STATUS
      // ============================================================

      inspection.status = "analysis_complete";

      await inspection.save();

      // ============================================================
      // 14. RETURN ACTUAL AI RESULTS
      // ============================================================

      return res.status(200).json({
        success: true,

        message: "AI analysis completed successfully",

        data: {
          inspectionId: inspection._id,

          detectionCount: savedAnalyses.length,

          inferenceTimeMs: aiResult.inference_time_ms,

          modelInfo: aiResult.model_info,

          detections: savedAnalyses,
        },
      });
    } catch (error) {
      // ============================================================
      // AI / DEPENDENCY ERROR
      // ============================================================

      if (
        req.params.inspectionId &&
        Types.ObjectId.isValid(req.params.inspectionId)
      ) {
        try {
          await Inspection.findByIdAndUpdate(req.params.inspectionId, {
            status: "analysis_pending",
          });
        } catch {
          // Preserve original error.
        }
      }

      if (axios.isAxiosError(error)) {
        console.error(
          "AI service request failed:",
          error.response?.data || error.message,
        );

        return res.status(503).json({
          success: false,
          message: "AI service unavailable",
          details: error.response?.data?.detail || error.message,
        });
      }

      next(error);
    }
  },
);

/**
 * GET /api/v1/analysis/inspections/:inspectionId
 *
 * Returns real stored onion analyses from MongoDB.
 */
router.get(
  "/inspections/:inspectionId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { inspectionId } = req.params;

      if (!Types.ObjectId.isValid(inspectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inspection ID",
        });
      }

      const analyses = await OnionAnalysis.find({
        inspectionId,
      }).sort({
        onionSequenceId: 1,
      });

      return res.status(200).json({
        success: true,
        data: analyses,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/v1/analysis/onions/:onionId
 *
 * Returns one real onion analysis from MongoDB.
 */
router.get(
  "/onions/:onionId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { onionId } = req.params;

      if (!Types.ObjectId.isValid(onionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid onion ID",
        });
      }

      const onion = await OnionAnalysis.findById(onionId);

      if (!onion) {
        return res.status(404).json({
          success: false,
          message: "Onion analysis not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: onion,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
