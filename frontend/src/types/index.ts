// ─── User & Auth Types ───────────────────────────────────────────────────────

export type UserRole = 'inspector' | 'supervisor' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inspection Types ────────────────────────────────────────────────────────

export type InspectionStatus =
  | 'draft'
  | 'images_uploaded'
  | 'analysis_pending'
  | 'analysis_in_progress'
  | 'analysis_complete'
  | 'verification_pending'
  | 'verification_complete'
  | 'report_generated'
  | 'cancelled';

export interface BatchInfo {
  batchId: string;
  procurementCentre: string;
  farmerName?: string;
  farmerCode?: string;
  supplierName?: string;
  vehicleNumber?: string;
  approximateWeightKg?: number;
  variety?: string;
  notes?: string;
}

export interface Inspection {
  _id: string;
  batchInfo: BatchInfo;
  inspectorId: string | User;
  status: InspectionStatus;
  imageReferences: string[];
  totalOnionsDetected?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Onion Analysis Types ────────────────────────────────────────────────────

/**
 * DefectType maps real YOLO class outcomes to stored defect labels.
 * Only values derived from actual model inference are used.
 */
export type DefectType =
  | 'none'       // healthy
  | 'disease'    // mold
  | 'rotting'    // rotten
  | 'sprouting'  // sprouted
  | 'other';

/**
 * OnionClassification derived from real detection result.
 * grade_a = healthy, rejected = mold/rotten/sprouted, unclassified = uncertain.
 * No AGMARK thresholds are invented — grading pending official verification.
 */
export type OnionClassification = 'grade_a' | 'urs' | 'rejected' | 'unclassified';

export type VerificationStatus = 'not_required' | 'pending' | 'verified' | 'overridden';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SizeEstimate {
  diameterMm?: number;
  category?: 'small' | 'medium' | 'large' | 'extra_large';
}

export interface OnionAnalysis {
  _id: string;
  inspectionId: string;
  onionSequenceId: string;
  sourceImageReference: string;
  cropImageReference?: string;
  boundingBox: BoundingBox;
  detectionConfidence: number;
  sizeEstimate?: SizeEstimate;
  shape?: string;
  /** Real detected defect flags from AI model inference */
  detectedDefects: DefectType[];
  classification: OnionClassification;
  /** Raw AI label e.g. "healthy (94.2%)" — not an invented grade */
  aiClassificationGrade?: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Human Verification Types ────────────────────────────────────────────────

export type VerificationDecision = 'confirm_ai' | 'override';

export interface Verification {
  _id: string;
  onionAnalysisId: string | OnionAnalysis;
  inspectionId: string;
  inspectorId: string | User;
  decision: VerificationDecision;
  inspectorClassification?: OnionClassification;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Report & Grading Types ──────────────────────────────────────────────────

/**
 * not_graded = no official AGMARK standard has been applied.
 * Grade is pending manual verification by an authorised inspector.
 */
export type FinalGrade = 'grade_a' | 'urs' | 'rejected' | 'mixed' | 'not_graded';

export interface GradingRuleSnapshot {
  standardId: string;
  standardName: string;
  ruleVersion: string;
}

export interface DistributionEntry {
  label: string;
  count: number;
  percentage: number;
}

export interface ReportSummary {
  totalOnionsDetected: number;
  totalOnionsVerified: number;
  classificationDistribution: DistributionEntry[];
  defectDistribution: DistributionEntry[];
  sizeDistribution: DistributionEntry[];
  finalGrade: FinalGrade;
  averageAiConfidence?: number;
  gradingRuleSnapshot?: GradingRuleSnapshot;
}

export interface Report {
  _id: string;
  inspectionId: string;
  generatedByInspectorId: string | User;
  summary: ReportSummary;
  pdfReference?: string;
  qrVerificationToken?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── API Response Envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
