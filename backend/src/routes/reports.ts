import { Router } from "express";
import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

import { Inspection } from "../models/Inspection";
import { OnionAnalysis } from "../models/OnionAnalysis";
import {
  Report,
  type IDistributionEntry,
  type FinalGrade,
} from "../models/Report";
import { getOrCreateDefaultInspector } from "../utils/defaultUser";

const router = Router();

// Generate official report for an inspection based on real detections
router.post(
  "/inspections/:inspectionId",
  async (req: Request, res: Response) => {
    try {
      const { inspectionId } = req.params;

      const inspection = await Inspection.findById(inspectionId);

      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: `Inspection batch not found with ID: ${inspectionId}`,
          code: "NOT_FOUND",
        });
      }

      const detections = await OnionAnalysis.find({ inspectionId });

      if (!detections || detections.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot generate quality report: No AI detections found for this inspection batch.",
          code: "NO_ANALYSIS_DATA",
        });
      }

      const totalDetected = detections.length;

      const totalVerified = detections.filter(
        (d) =>
          d.verificationStatus === "verified" ||
          d.verificationStatus === "overridden",
      ).length;

      // ============================================================
      // 1. CLASSIFICATION DISTRIBUTION
      // ============================================================

      const classCountMap: Record<string, number> = {};

      detections.forEach((detection) => {
        const classification = detection.classification || "unclassified";

        classCountMap[classification] =
          (classCountMap[classification] || 0) + 1;
      });

      const classificationDistribution: IDistributionEntry[] = Object.entries(
        classCountMap,
      ).map(([classification, count]) => {
        let label = "Unclassified";

        if (classification === "grade_a") {
          label = "Healthy / Prime Commercial";
        } else if (classification === "urs") {
          label = "Under-Sized / Secondary";
        } else if (classification === "rejected") {
          label = "Defective / Rejections";
        } else if (classification === "unclassified") {
          label = "Healthy / Unclassified";
        }

        return {
          label,
          count,
          percentage: Math.round((count / totalDetected) * 1000) / 10,
        };
      });

      // ============================================================
      // 2. DEFECT DISTRIBUTION
      // ============================================================

      const defectCountMap: Record<string, number> = {};

      detections.forEach((detection) => {
        const defects = detection.detectedDefects || [];

        // Normalize defects so "None", "NONE", "clean", etc.
        // are treated as no defect.
        const realDefects = defects.filter((defect) => {
          if (!defect) return false;

          const normalized = defect.toLowerCase().trim();

          return normalized !== "none" && normalized !== "clean";
        });

        if (realDefects.length === 0) {
          defectCountMap["Clean / No Defect"] =
            (defectCountMap["Clean / No Defect"] || 0) + 1;
        } else {
          realDefects.forEach((defect) => {
            const formatted = defect
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            defectCountMap[formatted] = (defectCountMap[formatted] || 0) + 1;
          });
        }
      });

      const defectDistribution: IDistributionEntry[] = Object.entries(
        defectCountMap,
      ).map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / totalDetected) * 1000) / 10,
      }));

      // ============================================================
      // 3. SIZE DISTRIBUTION
      // ============================================================

      const sizeDistribution: IDistributionEntry[] = [
        {
          label: "Sampled Batch Size",
          count: totalDetected,
          percentage: 100,
        },
      ];

      // ============================================================
      // 4. AVERAGE AI CONFIDENCE
      // ============================================================

      const totalConfidence = detections.reduce(
        (sum, detection) => sum + (detection.detectionConfidence || 0),
        0,
      );

      const averageAiConfidence =
        Math.round((totalConfidence / totalDetected) * 1000) / 1000;

      // ============================================================
      // 5. CLASSIFICATION COUNTS
      // ============================================================

      const classificationCounts = detections.reduce(
        (counts, detection) => {
          const classification = detection.classification || "unclassified";

          if (classification === "grade_a") {
            counts.gradeA += 1;
          } else if (classification === "urs") {
            counts.urs += 1;
          } else if (classification === "rejected") {
            counts.rejected += 1;
          } else {
            counts.unclassified += 1;
          }

          return counts;
        },
        {
          gradeA: 0,
          urs: 0,
          rejected: 0,
          unclassified: 0,
        },
      );

      // ============================================================
      // 6. REAL DEFECT COUNT
      // ============================================================

      const defectiveOnions = detections.filter((detection) => {
        const defects = detection.detectedDefects || [];

        return defects.some((defect) => {
          if (!defect) return false;

          const normalized = defect.toLowerCase().trim();

          return normalized !== "none" && normalized !== "clean";
        });
      }).length;

      // ============================================================
      // 7. FINAL GRADE - PERCENTAGE BASED
      // ============================================================
      //
      // Healthy percentage decides the final batch grade.
      //
      // 85% - 100% healthy  -> GRADE A
      // 70% - 84.99%       -> URS
      // Below 70%          -> REJECTED
      //
      // IMPORTANT:
      // Defective onions do NOT automatically reject the
      // complete batch anymore.
      //
      // Example:
      // 100 total / 92 healthy / 8 defective
      // = 92% healthy
      // = GRADE A
      // ============================================================

      // ============================================================
      // 7. FINAL GRADE - PERCENTAGE BASED
      // ============================================================
      //
      // Healthy onions include:
      //   - grade_a
      //   - unclassified (when there is no real defect)
      //
      // Grading:
      //   85% or more healthy -> Grade A
      //   70% to 84.99%      -> URS
      //   Below 70%          -> Rejected
      //
      // Example:
      //   100 total
      //   92 healthy
      //   8 defective
      //   => 92% healthy
      //   => Grade A
      //
      // Example:
      //   8 total
      //   8 healthy/unclassified
      //   => 100% healthy
      //   => Grade A
      // ============================================================

      const healthyCount =
        classificationCounts.gradeA + classificationCounts.unclassified;

      const healthyPercentage = (healthyCount / totalDetected) * 100;

      let finalGrade: FinalGrade;

      if (healthyPercentage >= 85) {
        finalGrade = "grade_a";
      } else if (healthyPercentage >= 70) {
        finalGrade = "urs";
      } else {
        finalGrade = "rejected";
      }

      console.log(
        `Grading: ${healthyCount}/${totalDetected} healthy = ${healthyPercentage.toFixed(
          1,
        )}% -> ${finalGrade}`,
      );

      console.log(
        `Grading: ${classificationCounts.gradeA}/${totalDetected} healthy = ${healthyPercentage.toFixed(
          1,
        )}% -> ${finalGrade}`,
      );

      // ============================================================
      // 8. INSPECTOR
      // ============================================================

      const inspector = await getOrCreateDefaultInspector();

      // ============================================================
      // 9. CREATE / UPDATE REPORT
      // ============================================================

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
            standardId: "ONIONQ_INTERNAL_CLASSIFICATION",

            standardName: "OnionQ Internal Quality Classification",

            ruleVersion: "2.0.0",

            gradingRules: {
              gradeA: "85% or more healthy onions",
              urs: "70% to 84.99% healthy onions",
              rejected: "Below 70% healthy onions",
            },
          },
        },

        qrVerificationToken: `oq-cert-${uuidv4().substring(0, 8)}`,
      };

      const report = await Report.findOneAndUpdate(
        { inspectionId: inspection._id },
        reportData,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).populate("generatedByInspectorId", "name email role");

      // ============================================================
      // 10. UPDATE INSPECTION STATUS
      // ============================================================

      inspection.status = "report_generated";

      await inspection.save();

      // ============================================================
      // 11. RESPONSE
      // ============================================================

      return res.json({
        success: true,
        message: "Quality assessment report compiled successfully",
        data: report,
      });
    } catch (err: any) {
      console.error("Failed to generate report:", err);

      return res.status(500).json({
        success: false,
        message: `Failed to generate report: ${err.message}`,
        code: "DB_ERROR",
      });
    }
  },
);

// ============================================================
// Get report for an inspection
// =======================================================

router.get(
  "/inspections/:inspectionId",
  async (req: Request, res: Response) => {
    try {
      const report = await Report.findOne({
        inspectionId: req.params.inspectionId,
      }).populate("generatedByInspectorId", "name email role");

      if (!report) {
        return res.status(404).json({
          success: false,
          message: `Report not found for inspection ID: ${req.params.inspectionId}`,
          code: "NOT_FOUND",
        });
      }

      return res.json({
        success: true,
        data: report,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: `Failed to retrieve report: ${err.message}`,
        code: "DB_ERROR",
      });
    }
  },
);

// ============================================================
// Verify report via public QR token
// ============================================================

router.get("/verify/:token", async (req: Request, res: Response) => {
  try {
    const report = await Report.findOne({
      qrVerificationToken: req.params.token,
    }).populate("generatedByInspectorId", "name email role");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Certificate not found for verification token: ${req.params.token}`,
        code: "NOT_FOUND",
      });
    }

    return res.json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Failed to verify report: ${err.message}`,
      code: "DB_ERROR",
    });
  }
});

export default router;
