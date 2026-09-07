import { Schema, model, Document, Types } from 'mongoose';

export type DefectType =
  | 'none'
  | 'mechanical_damage'
  | 'disease'
  | 'sunburn'
  | 'sprouting'
  | 'rotting'
  | 'double_onion'
  | 'split'
  | 'other';

export type OnionClassification = 'grade_a' | 'urs' | 'rejected' | 'unclassified';

export type VerificationStatus = 'not_required' | 'pending' | 'verified' | 'overridden';

export interface IBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ISizeEstimate {
  diameterMm?: number;
  category?: 'small' | 'medium' | 'large' | 'extra_large';
}

export interface IOnionAnalysis extends Document {
  _id: Types.ObjectId;
  inspectionId: Types.ObjectId;
  /** Sequential ID within the inspection e.g. "ONI-001" */
  onionSequenceId: string;
  /** Source image reference (storage path or key) */
  sourceImageReference: string;
  /** Cropped image reference for this individual onion */
  cropImageReference?: string;
  boundingBox: IBoundingBox;
  detectionConfidence: number;
  sizeEstimate?: ISizeEstimate;
  shape?: string;
  detectedDefects: DefectType[];
  classification: OnionClassification;
  aiClassificationGrade?: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const boundingBoxSchema = new Schema<IBoundingBox>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const sizeEstimateSchema = new Schema<ISizeEstimate>(
  {
    diameterMm: { type: Number, min: 0 },
    category: {
      type: String,
      enum: ['small', 'medium', 'large', 'extra_large'],
    },
  },
  { _id: false }
);

const onionAnalysisSchema = new Schema<IOnionAnalysis>(
  {
    inspectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Inspection',
      required: [true, 'Inspection ID is required'],
    },
    onionSequenceId: {
      type: String,
      required: true,
      trim: true,
    },
    sourceImageReference: {
      type: String,
      required: true,
    },
    cropImageReference: {
      type: String,
    },
    boundingBox: {
      type: boundingBoxSchema,
      required: true,
    },
    detectionConfidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    sizeEstimate: {
      type: sizeEstimateSchema,
    },
    shape: {
      type: String,
      trim: true,
    },
    detectedDefects: {
      type: [String],
      enum: [
        'none',
        'mechanical_damage',
        'disease',
        'sunburn',
        'sprouting',
        'rotting',
        'double_onion',
        'split',
        'other',
      ] as DefectType[],
      default: [],
    },
    classification: {
      type: String,
      enum: ['grade_a', 'urs', 'rejected', 'unclassified'] as OnionClassification[],
      default: 'unclassified',
    },
    aiClassificationGrade: {
      type: String,
    },
    verificationStatus: {
      type: String,
      enum: ['not_required', 'pending', 'verified', 'overridden'] as VerificationStatus[],
      default: 'not_required',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

onionAnalysisSchema.index({ inspectionId: 1 });
onionAnalysisSchema.index({ inspectionId: 1, onionSequenceId: 1 }, { unique: true });
onionAnalysisSchema.index({ verificationStatus: 1 });

export const OnionAnalysis = model<IOnionAnalysis>('OnionAnalysis', onionAnalysisSchema);
