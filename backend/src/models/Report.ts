import { Schema, model, Document, Types } from 'mongoose';

export type FinalGrade = 'grade_a' | 'urs' | 'rejected' | 'mixed' | 'not_graded';

export interface IGradingRuleSnapshot {
  /** Identifier of the grading standard used e.g. "AGMARK_2024" */
  standardId: string;
  standardName: string;
  /** Version of the rule set applied */
  ruleVersion: string;
}

export interface IDistributionEntry {
  label: string;
  count: number;
  percentage: number;
}

export interface IReportSummary {
  totalOnionsDetected: number;
  totalOnionsVerified: number;
  classificationDistribution: IDistributionEntry[];
  defectDistribution: IDistributionEntry[];
  sizeDistribution: IDistributionEntry[];
  finalGrade: FinalGrade;
  averageAiConfidence?: number;
  gradingRuleSnapshot?: IGradingRuleSnapshot;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  generatedByInspectorId: Types.ObjectId;
  summary: IReportSummary;
  /** Storage reference for the generated PDF file */
  pdfReference?: string;
  /** UUID used for QR-based report verification */
  qrVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const distributionEntrySchema = new Schema<IDistributionEntry>(
  {
    label: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const reportSummarySchema = new Schema<IReportSummary>(
  {
    totalOnionsDetected: { type: Number, required: true, min: 0 },
    totalOnionsVerified: { type: Number, required: true, min: 0 },
    classificationDistribution: { type: [distributionEntrySchema], default: [] },
    defectDistribution: { type: [distributionEntrySchema], default: [] },
    sizeDistribution: { type: [distributionEntrySchema], default: [] },
    finalGrade: {
      type: String,
      enum: ['grade_a', 'urs', 'rejected', 'mixed', 'not_graded'],
      required: true,
    },
    averageAiConfidence: { type: Number, min: 0, max: 1 },
    gradingRuleSnapshot: {
      type: new Schema(
        {
          standardId: { type: String, required: true },
          standardName: { type: String, required: true },
          ruleVersion: { type: String, required: true },
        },
        { _id: false }
      ),
    },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: [true, 'Inspection ID is required'],
      unique: true, // One report per inspection
    },
    generatedByInspectorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inspector ID is required'],
    },
    summary: {
      type: reportSummarySchema,
      required: true,
    },
    pdfReference: {
      type: String,
    },
    qrVerificationToken: {
      type: String,
      unique: true,
      sparse: true, // Allow null while still enforcing uniqueness when set
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

reportSchema.index({ inspectionId: 1 });
reportSchema.index({ qrVerificationToken: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = model<IReport>('Report', reportSchema);
